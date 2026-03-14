// Funções pra ajudar a lidar com agendamento de remédio, tipo, pra não se perder nos horários rs

// Faz uma lista de horários a partir de um horário inicial e de quanto em quanto tempo tem que tomar
// Exemplo: começa 08:00, de 6 em 6h, vai dar 08:00, 14:00, 20:00, etc
export function generateScheduleTimes(
  startTime: string,
  intervalHours: number
): string[] {
  const horarios: string[] = [];
  const [startHour, startMinute] = startTime.split(":").map(Number);

  // Vê quantas vezes vai tomar no dia
  const numDoses = 24 / intervalHours;

  for (let i = 0; i < numDoses; i++) {
    const totalMinutes = startHour * 60 + startMinute + i * intervalHours * 60;
    const hour = Math.floor(totalMinutes / 60) % 24;
    const minute = totalMinutes % 60;

    const formattedTime = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
    horarios.push(formattedTime);
  }

  return horarios;
}

/**
 * Verifica se um medicamento está ativo em uma data específica
 * @param medicamento - Objeto do medicamento
 * @param dataVerificar - Data para verificar (formato YYYY-MM-DD ou Date)
 * @returns true se o medicamento está ativo na data
 */
export function isActiveMedication(
  medicamento: any,
  dataVerificar: string | Date = new Date()
): boolean {
  const dataCheck =
    typeof dataVerificar === "string"
      ? new Date(dataVerificar)
      : dataVerificar;

  const dataInicio = new Date(medicamento.inicio);

  // Se ainda não começou, nem adianta mostrar
  if (dataCheck < dataInicio) return false;

  // Se for uso continuo, depois que começa já era, tá sempre ativo
  if (medicamento.uso_continuo) return true;

  // Se tem data de fim, só mostra se ainda não passou da data
  if (medicamento.data_fim) {
    const dataFim = new Date(medicamento.data_fim);
    return dataCheck <= dataFim;
  }

  // Se tem duração em dias, calcula até quando vai
  if (medicamento.duracao_days) {
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataFim.getDate() + medicamento.duracao_days);
    return dataCheck <= dataFim;
  }

  return true;
}

// Filtra só os remédios que tão ativos naquele dia
export function getActiveMedicationsForDate(
  medicamentos: any[],
  data: string | Date = new Date()
): any[] {
  return medicamentos.filter((med) => isActiveMedication(med, data));
}

// Vê se o remédio aparece num dia da semana (tipo só segunda, quarta, sexta...)
export function shouldShowOnWeekday(
  medicamento: any,
  diaSemana: number
): boolean {
  // Se não tem nada definido, mostra todo dia mesmo
  if (!medicamento.dias_semana) return true;

  const diasArray = medicamento.dias_semana
    .split(",")
    .map((d: string) => parseInt(d.trim()));
  return diasArray.includes(diaSemana);
}

// Pega os horários do remédio, seja array, json ou string separada por vírgula
export function getMedicamentoHorarios(medicamento: any): string[] {
  if (!medicamento.horarios) return [];

  // Se já for array, só devolve
  if (Array.isArray(medicamento.horarios)) {
    return medicamento.horarios;
  }

  // Se for string tipo JSON, tenta converter
  if (typeof medicamento.horarios === "string") {
    try {
      const parsed = JSON.parse(medicamento.horarios);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // Se não for JSON, tenta separar por vírgula mesmo, vai que né
      return medicamento.horarios.split(",").map((h: string) => h.trim());
    }
  }

  return [];
}

// Transforma array de horários em string pra salvar no banco (jsonzão)
export function formatHorariosForDB(horarios: string[]): string {
  return JSON.stringify(horarios);
}

// Opções de intervalo que o povo costuma usar
export const INTERVAL_OPTIONS = [
  { value: 4, label: "4/4 horas", doses: 6 },
  { value: 6, label: "6/6 horas", doses: 4 },
  { value: 8, label: "8/8 horas", doses: 3 },
  { value: 12, label: "12/12 horas", doses: 2 },
];

// Dias da semana, pra mostrar bonitinho na tela
export const DIAS_SEMANA = [
  { value: 0, label: "Dom", fullLabel: "Domingo" },
  { value: 1, label: "Seg", fullLabel: "Segunda-feira" },
  { value: 2, label: "Ter", fullLabel: "Terça-feira" },
  { value: 3, label: "Qua", fullLabel: "Quarta-feira" },
  { value: 4, label: "Qui", fullLabel: "Quinta-feira" },
  { value: 5, label: "Sex", fullLabel: "Sexta-feira" },
  { value: 6, label: "Sáb", fullLabel: "Sábado" },
];
