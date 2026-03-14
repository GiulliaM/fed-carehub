
// Modal pra escolher intervalo dos horários, tipo de quanto em quanto tempo toma o remédio
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { INTERVALOS_DISPONIVEIS } from '../utils/agendadorMedicamento';
import cores from '../config/cores';

interface IntervaloModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectIntervalo: (intervalHours: number) => void;
  intervaloAtual?: number;
}

export default function IntervaloModal({
  visible,
  onClose,
  onSelectIntervalo,
  intervaloAtual,
}: IntervaloModalProps) {
  const [selectedIntervalo, setSelectedIntervalo] = useState<number | null>(
    intervaloAtual || null
  );

  const handleConfirm = () => {
    if (selectedIntervalo) {
      onSelectIntervalo(selectedIntervalo);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Selecione o intervalo</Text>
          <Text style={styles.subtitle}>
            Os horários serão gerados automaticamente
          </Text>

          <ScrollView style={styles.optionsContainer}>
            {INTERVALOS_DISPONIVEIS.map((intervalo) => (
              <TouchableOpacity
                key={intervalo.horas}
                style={[
                  styles.optionButton,
                  selectedIntervalo === intervalo.horas &&
                    styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedIntervalo(intervalo.horas)}
              >
                <View style={styles.optionContent}>
                  <Text
                    style={[
                      styles.optionLabel,
                      selectedIntervalo === intervalo.horas &&
                        styles.optionLabelSelected,
                    ]}
                  >
                    {intervalo.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDoses,
                      selectedIntervalo === intervalo.horas &&
                        styles.optionDosesSelected,
                    ]}
                  >
                    {intervalo.doses} {intervalo.doses === 1 ? 'dose' : 'doses'}{' '}
                    por dia
                  </Text>
                </View>
                {selectedIntervalo === intervalo.horas && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonCancel]}
              onPress={onClose}
            >
              <Text style={styles.buttonCancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonConfirm,
                !selectedIntervalo && styles.buttonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!selectedIntervalo}
            >
              <Text style={styles.buttonConfirmText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: cores.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsContainer: {
    maxHeight: 300,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginBottom: 12,
    backgroundColor: '#F8F8F8',
  },
  optionButtonSelected: {
    borderColor: cores.primary,
    backgroundColor: '#E8F5E9',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: cores.primary,
  },
  optionDoses: {
    fontSize: 14,
    color: '#666',
  },
  optionDosesSelected: {
    color: cores.primary,
    fontWeight: '500',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: cores.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#F0F0F0',
  },
  buttonCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonConfirm: {
    backgroundColor: cores.primary,
  },
  buttonConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
});
