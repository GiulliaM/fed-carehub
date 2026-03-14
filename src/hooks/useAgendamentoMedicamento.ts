
// Hook pra agendar remédio, porque ninguém merece esquecer
import { useState } from 'react';
import { generateScheduleTimes } from '../utils/agendamentoMedicamento';

export function useAgendamentoMedicamento(horariosIniciais: string[] = []) {
  const [horariosGerados, setHorariosGerados] = useState<string[]>(horariosIniciais);

  function aoSelecionarIntervalo(horarioInicio: string, intervalo: number): void {
    const horarios = generateScheduleTimes(horarioInicio, intervalo);
    setHorariosGerados(horarios);
  }

  function aoEditarHorario(indice: number, novoHorario: string): void {
    if (!novoHorario.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      console.warn('Formato de horario invalido. Use HH:mm');
      return;
    }

    setHorariosGerados((anteriores) => {
      const novos = [...anteriores];
      novos[indice] = novoHorario;
      return novos.sort();
    });
  }

  function aoRemoverHorario(indice: number): void {
    setHorariosGerados((anteriores) => anteriores.filter((_, i) => i !== indice));
  }

  function aoAdicionarHorario(novoHorario: string): void {
    if (!novoHorario.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      console.warn('Formato de horario invalido. Use HH:mm');
      return;
    }

    setHorariosGerados((anteriores) => {
      if (anteriores.includes(novoHorario)) return anteriores;
      return [...anteriores, novoHorario].sort();
    });
  }

  function aoResetarHorarios(): void {
    setHorariosGerados([]);
  }

  function definirHorarios(horarios: string[]): void {
    setHorariosGerados(horarios);
  }

  return {
    horariosGerados,
    aoSelecionarIntervalo,
    aoEditarHorario,
    aoRemoverHorario,
    aoAdicionarHorario,
    aoResetarHorarios,
    definirHorarios,
  };
}
