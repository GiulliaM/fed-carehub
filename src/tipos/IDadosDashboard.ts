/**
 * Tipos usados pelo dashboard (Home) no frontend.
 */

/** Perfil simplificado do paciente retornado pelo backend */
export interface IPacientePerfil {
  id: number;
  nome_paciente: string;
  data_nascimento?: string | null;
  informacoes_medicas?: string | null;
  foto_url?: string | null;
  nome_cuidador_ativo?: string | null;
}

/** Resumo de um cuidado (medicamento/consulta) */
export interface ICuidadoResumo {
  nome: string;
  horario: string; // ex: "08:00" ou "Hoje, às 08:00"
}

/** Registro resumido para exibição no feed/diário */
export interface IRegistroResumo {
  tipo?: string;
  titulo: string;
  subtitulo?: string;
  data?: string;
}

/** Estrutura completa retornada pela rota /api/dashboard/:pacienteId */
export interface IDadosDashboard {
  perfilPaciente: IPacientePerfil | null;
  proximoMedicamento: ICuidadoResumo | null;
  proximaConsulta: ICuidadoResumo | null;
  cuidadorAtivo: { nome?: string | null };
  alertasPendentes: { total: number };
  atividadesRecentes: IRegistroResumo[];
}

/** Valor inicial (mock) para uso enquanto o fetch não retorna dados */
export const initialDashboardData: IDadosDashboard = {
  perfilPaciente: null,
  proximoMedicamento: null,
  proximaConsulta: null,
  cuidadorAtivo: { nome: null },
  alertasPendentes: { total: 0 },
  atividadesRecentes: [],
};