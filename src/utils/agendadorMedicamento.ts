// Funções pra ajudar a não se perder nos horários dos remédios, rs

// Faz uma lista de horários a partir do horário inicial e intervalo, tipo 12:00, 18:00, etc
export function generateScheduleTimes(
  startTime: string,
  intervalHours: number
): string[] {
  // Confere se veio tudo certinho
  if (!startTime || !intervalHours) return [];
  if (![4, 6, 8, 12].includes(intervalHours)) {
    throw new Error('Intervalo deve ser 4, 6, 8 ou 12 horas');
  }

  // Pega o horário inicial e separa hora e minuto
  const [hours, minutes] = startTime.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Horário inicial tá errado, tem que ser tipo 08:00');
  }

  // Vê quantas vezes vai tomar no dia
  const dosesPerDay = 24 / intervalHours;
  const schedules: string[] = [];

  // Gera os horários certinho
  for (let i = 0; i < dosesPerDay; i++) {
    const totalMinutes = hours * 60 + minutes + i * intervalHours * 60;
    const finalHours = Math.floor(totalMinutes / 60) % 24;
    const finalMinutes = totalMinutes % 60;

    const timeString = `${String(finalHours).padStart(2, '0')}:${String(
      finalMinutes
    ).padStart(2, '0')}`;
    schedules.push(timeString);
  }

  return schedules;
}

// Vê se o remédio tá ativo na data que quer saber
export function isMedicamentoAtivoNaData(
  medicamento: any,
  targetDate: Date
): boolean {
  const inicio = new Date(medicamento.inicio);
  inicio.setHours(0, 0, 0, 0);
  
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  // Se ainda não começou, nem adianta mostrar
  if (target < inicio) return false;

  // Se for uso continuo, depois que começa já era, tá sempre ativo
  if (medicamento.uso_continuo) return true;

  // Se tem data de fim, só mostra se ainda não passou da data
  if (medicamento.data_fim) {
    const fim = new Date(medicamento.data_fim);
    fim.setHours(23, 59, 59, 999);
    return target <= fim;
  }

  // Se tem duração em dias, calcula até quando vai
  if (medicamento.duracao_days) {
    const fimCalculado = new Date(inicio);
    fimCalculado.setDate(fimCalculado.getDate() + medicamento.duracao_days);
    fimCalculado.setHours(23, 59, 59, 999);
    return target <= fimCalculado;
  }

  return false;
}

// Vê se o remédio é pra tomar nesse dia da semana mesmo
export function isMedicamentoValidoNoDiaSemana(
  medicamento: any,
  targetDate: Date
): boolean {
  // Se não tiver restrição, pode tomar qualquer dia
  if (!medicamento.dias_semana) return true;

  const diaSemanaTarget = targetDate.getDay(); // 0 = Domingo, 6 = Sábado
  const diasPermitidos = medicamento.dias_semana
    .split(',')
    .map((d: string) => parseInt(d.trim()));

  return diasPermitidos.includes(diaSemanaTarget);
}

// Retorna array com remédio e horários do dia
export function getMedicamentosParaData(
  medicamentos: any[],
  targetDate: Date = new Date()
): Array<{ medicamento: any; horarios: string[] }> {
  return medicamentos
    .filter(
      (med) =>
        isMedicamentoAtivoNaData(med, targetDate) &&
        isMedicamentoValidoNoDiaSemana(med, targetDate)
    )
    .map((med) => ({
      medicamento: med,
      horarios: Array.isArray(med.horarios) ? med.horarios : [],
    }));
}

// Deixa o intervalo bonitinho pra mostrar na tela
export function formatarIntervalo(intervalHours: number): string {
  return `${intervalHours}/${intervalHours} horas`;
}

// Faz uma frase dizendo quantas doses por dia tem que tomar
export function getDescricaoDoses(intervalHours: number): string {
  const doses = 24 / intervalHours;
  return `${doses} ${doses === 1 ? 'dose' : 'doses'} por dia`;
}

// Confere se o horário tá certinho (tipo 08:00)
export function isHorarioValido(time: string): boolean {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(time);
}

// Opções de intervalo que o povo costuma usar
export const INTERVALOS_DISPONIVEIS = [
  { horas: 4, label: '4/4 horas', doses: 6 },
  { horas: 6, label: '6/6 horas', doses: 4 },
  { horas: 8, label: '8/8 horas', doses: 3 },
  { horas: 12, label: '12/12 horas', doses: 2 },
];
