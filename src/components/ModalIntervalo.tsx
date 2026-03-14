
// Modal pra definir intervalo dos horários, tipo "de quanto em quanto tempo toma"
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { INTERVAL_OPTIONS } from "../utils/agendamentoMedicamento";
import cores from "../config/cores";

interface PropsModalIntervalo {
  visible: boolean;
  onClose: () => void;
  onSelect: (intervalHours: number) => void;
}

export default function ModalIntervalo({
  visible,
  onClose,
  onSelect,
}: PropsModalIntervalo) {
  const [selectedInterval, setSelectedInterval] = useState<number | null>(null);

  const handleConfirm = () => {
    if (selectedInterval) {
      onSelect(selectedInterval);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Selecione o Intervalo</Text>
          <Text style={styles.subtitle}>
            Escolha de quanto em quanto tempo o medicamento deve ser tomado
          </Text>

          <ScrollView style={styles.optionsContainer}>
            {INTERVAL_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  selectedInterval === option.value &&
                    styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedInterval(option.value)}
              >
                <View>
                  <Text
                    style={[
                      styles.optionLabel,
                      selectedInterval === option.value &&
                        styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDoses,
                      selectedInterval === option.value &&
                        styles.optionDosesSelected,
                    ]}
                  >
                    {option.doses} doses por dia
                  </Text>
                </View>
                {selectedInterval === option.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                !selectedInterval && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!selectedInterval}
            >
              <Text style={styles.confirmButtonText}>Confirmar</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxHeight: "70%",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: cores.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  optionButtonSelected: {
    borderColor: cores.primary,
    backgroundColor: "#f0f7ff",
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  optionLabelSelected: {
    color: cores.primary,
  },
  optionDoses: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  optionDosesSelected: {
    color: cores.primary,
  },
  checkmark: {
    fontSize: 24,
    color: cores.primary,
    fontWeight: "700",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  confirmButton: {
    backgroundColor: cores.primary,
  },
  confirmButtonDisabled: {
    backgroundColor: "#ccc",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
