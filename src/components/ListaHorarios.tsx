
// Lista de horários pra mostrar e editar, tipo agenda de remédio
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import cores from '../config/cores';
import { isHorarioValido } from '../utils/agendadorMedicamento';

interface PropsListaHorarios {
  horarios: string[];
  onChange: (novosHorarios: string[]) => void;
  editable?: boolean;
}

export default function ListaHorarios({
  horarios,
  onChange,
  editable = true,
}: PropsListaHorarios) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());

  const handleRemoveHorario = (index: number) => {
    if (horarios.length === 1) {
      Alert.alert(
        'Atenção',
        'É necessário ter pelo menos um horário cadastrado.'
      );
      return;
    }

    Alert.alert(
      'Remover horário',
      `Deseja remover o horário ${horarios[index]}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            const novosHorarios = horarios.filter((_, i) => i !== index);
            onChange(novosHorarios);
          },
        },
      ]
    );
  };

  const handleEditHorario = (index: number) => {
    const [hours, minutes] = horarios[index].split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    setTempTime(date);
    setEditingIndex(index);
    setShowTimePicker(true);
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    
    if (event.type === 'set' && selectedDate && editingIndex !== null) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const newTime = `${hours}:${minutes}`;

      // Verificar se o horário já existe
      if (horarios.includes(newTime) && horarios[editingIndex] !== newTime) {
        Alert.alert('Atenção', 'Este horário já está cadastrado.');
        return;
      }

      const novosHorarios = [...horarios];
      novosHorarios[editingIndex] = newTime;
      // Ordenar horários
      novosHorarios.sort();
      onChange(novosHorarios);
    }
    
    setEditingIndex(null);
  };

  const handleAddHorario = () => {
    const date = new Date();
    date.setHours(12, 0);
    setTempTime(date);
    setEditingIndex(-1); // -1 indica novo horário
    setShowTimePicker(true);
  };

  const handleAddNewTime = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    
    if (event.type === 'set' && selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const newTime = `${hours}:${minutes}`;

      // Verificar se o horário já existe
      if (horarios.includes(newTime)) {
        Alert.alert('Atenção', 'Este horário já está cadastrado.');
        return;
      }

      const novosHorarios = [...horarios, newTime];
      // Ordenar horários
      novosHorarios.sort();
      onChange(novosHorarios);
    }
    
    setEditingIndex(null);
  };

  if (!horarios || horarios.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Nenhum horário definido
        </Text>
        {editable && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddHorario}>
            <Text style={styles.addButtonText}>+ Adicionar horário</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Horários programados:</Text>
      {horarios.map((horario, index) => (
        <View key={index} style={styles.horarioItem}>
          <Text style={styles.horarioText}>{horario}</Text>
          {editable && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditHorario(index)}
              >
                <Text style={styles.editButtonText}>✎</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveHorario(index)}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}

      {editable && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddHorario}
        >
          <Text style={styles.addButtonText}>+ Adicionar horário</Text>
        </TouchableOpacity>
      )}

      {showTimePicker && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={editingIndex === -1 ? handleAddNewTime : handleTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  horarioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  horarioText: {
    fontSize: 18,
    fontWeight: '600',
    color: cores.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  removeButton: {
    backgroundColor: '#F44336',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 26,
  },
  addButton: {
    backgroundColor: cores.primary,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 2,
    borderColor: cores.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: cores.primary,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
});
