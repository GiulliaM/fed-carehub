// helpers de data

import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import dayjs from 'dayjs';

export const formatarDataAmigavel = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (normalizedDate.getTime() === today.getTime()) return 'Hoje';

  const tomorrow = addDays(today, 1);
  if (normalizedDate.getTime() === tomorrow.getTime()) return 'Amanhã';

  const yesterday = subDays(today, 1);
  if (normalizedDate.getTime() === yesterday.getTime()) return 'Ontem';

  return format(date, "EEE, dd MMM", { locale: ptBR });
};

export const adicionarDia = (date: Date): Date => addDays(date, 1);

export const subtrairDia = (date: Date): Date => subDays(date, 1);

export function calcularIdade(dataNasc?: string | null, idadeEstatica?: number | null): string {
  if (dataNasc) return `${dayjs().diff(dayjs(dataNasc), "year")} anos`;
  return idadeEstatica != null ? `${idadeEstatica} anos` : "N/I";
}