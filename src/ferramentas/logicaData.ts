
// Funções pra mexer com datas, porque ninguém merece fazer isso na mão
// frontend/src/ferramentas/logicaData.ts

import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data para exibição amigável (Hoje, Amanhã, Ontem, ou data curta).
 */
export const formatarDataAmigavel = (date: Date): string => {
  const now = new Date();
  // Normaliza para o início do dia para comparação
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (normalizedDate.getTime() === today.getTime()) {
    return 'Hoje';
  }
  
  const tomorrow = addDays(today, 1);
  if (normalizedDate.getTime() === tomorrow.getTime()) {
    return 'Amanhã';
  }
  
  const yesterday = subDays(today, 1);
  if (normalizedDate.getTime() === yesterday.getTime()) {
    return 'Ontem';
  }
  
  // Exemplo: Sex, 07 Jun
  return format(date, "EEE, dd MMM", { locale: ptBR });
};

/**
 * Adiciona um dia à data fornecida.
 */
export const adicionarDia = (date: Date): Date => {
  return addDays(date, 1);
};

/**
 * Subtrai um dia da data fornecida.
 */
export const subtrairDia = (date: Date): Date => {
  return subDays(date, 1);
};