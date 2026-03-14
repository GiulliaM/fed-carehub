// Tipos de categoria que o diário pode ter, tipo humor, sono, etc. Se inventar mais, só por aqui
export type DiarioCategoria =
  | "humor"
  | "ocorrencias"
  | "sintomas"
  | "digestao"
  | "atividade_fisica";

// Um item do diário, tipo uma anotação
export interface DiarioItem {
  codigo: string;
  label: string;
  icon: string;
  temCampo?: boolean;
  campoLabel?: string;
  contagem?: boolean;
}

// Categoria do diário, pra organizar melhor
export interface CategoriaDiario {
  key: DiarioCategoria;
  label: string;
  icon: string;
  itens: DiarioItem[];
}

export const CATALOGO_DIARIO: CategoriaDiario[] = [
  {
    key: "humor",
    label: "Humor",
    icon: "happy-outline",
    itens: [
      { codigo: "feliz", label: "Feliz", icon: "happy-outline" },
      { codigo: "calmo", label: "Calmo(a)", icon: "leaf-outline" },
      { codigo: "triste", label: "Triste", icon: "sad-outline" },
      { codigo: "desanimado", label: "Desanimado(a)", icon: "cloudy-outline" },
      { codigo: "bravo", label: "Bravo(a)", icon: "thunderstorm-outline" },
      { codigo: "ansioso", label: "Ansioso(a)", icon: "pulse-outline" },
      { codigo: "culpado", label: "Culpado(a)", icon: "alert-circle-outline" },
      { codigo: "confuso", label: "Confuso(a)", icon: "help-circle-outline" },
      { codigo: "apatico", label: "Apatico(a)", icon: "remove-circle-outline" },
    ],
  },
  {
    key: "ocorrencias",
    label: "Ocorrencias",
    icon: "warning-outline",
    itens: [
      {
        codigo: "vazamento_urina",
        label: "Vazamento (urina)",
        icon: "water-outline",
      },
      {
        codigo: "vazamento_fezes",
        label: "Vazamento (fezes)",
        icon: "water-outline",
      },
      {
        codigo: "tombo_queda",
        label: "Tombo / Queda",
        icon: "trending-down-outline",
        temCampo: true,
        campoLabel: "Como ocorreu o tombo? Onde caiu?",
      },
      {
        codigo: "machucado",
        label: "Machucado",
        icon: "bandage-outline",
        temCampo: true,
        campoLabel: "Local do machucado",
      },
      {
        codigo: "agitacao",
        label: "Agitacao",
        icon: "flash-outline",
      },
      {
        codigo: "desorientacao",
        label: "Desorientacao",
        icon: "compass-outline",
      },
    ],
  },
  {
    key: "sintomas",
    label: "Sintomas",
    icon: "fitness-outline",
    itens: [
      {
        codigo: "tudo_bem",
        label: "Esta tudo bem",
        icon: "thumbs-up-outline",
      },
      {
        codigo: "dor_cabeca",
        label: "Dor de cabeca",
        icon: "head-outline",
      },
      {
        codigo: "dor_costas",
        label: "Dor nas costas",
        icon: "body-outline",
      },
      {
        codigo: "dor_outro",
        label: "Dor (outra)",
        icon: "medkit-outline",
        temCampo: true,
        campoLabel: "Especifique a dor",
      },
      { codigo: "fadiga", label: "Fadiga", icon: "battery-dead-outline" },
      {
        codigo: "apetite_descontrolado",
        label: "Apetite descontrolado",
        icon: "fast-food-outline",
      },
      {
        codigo: "falta_apetite",
        label: "Falta de apetite",
        icon: "close-circle-outline",
      },
      { codigo: "insonia", label: "Insonia", icon: "moon-outline" },
      { codigo: "sonolencia", label: "Sonolencia", icon: "bed-outline" },
      { codigo: "febre", label: "Febre", icon: "thermometer-outline" },
      { codigo: "tontura", label: "Tontura", icon: "sync-outline" },
      {
        codigo: "outro_sintoma",
        label: "Outro",
        icon: "ellipsis-horizontal-outline",
        temCampo: true,
        campoLabel: "Especifique o sintoma",
      },
    ],
  },
  {
    key: "digestao",
    label: "Digestao e fezes",
    icon: "nutrition-outline",
    itens: [
      { codigo: "nausea", label: "Nausea", icon: "water-outline" },
      { codigo: "inchaco", label: "Inchaco", icon: "ellipse-outline" },
      {
        codigo: "prisao_ventre",
        label: "Prisao de ventre",
        icon: "lock-closed-outline",
      },
      { codigo: "diarreia", label: "Diarreia", icon: "trending-down-outline" },
      {
        codigo: "evacuou",
        label: "Evacuou (fezes)",
        icon: "log-out-outline",
        contagem: true,
      },
      {
        codigo: "urinou",
        label: "Urinou",
        icon: "water-outline",
        contagem: true,
      },
      {
        codigo: "vomito",
        label: "Vomito",
        icon: "arrow-up-circle-outline",
      },
    ],
  },
  {
    key: "atividade_fisica",
    label: "Atividade fisica",
    icon: "walk-outline",
    itens: [
      {
        codigo: "nao_exercitou",
        label: "Nao se exercitou",
        icon: "close-circle-outline",
      },
      {
        codigo: "caminhada",
        label: "Caminhada",
        icon: "walk-outline",
      },
      {
        codigo: "fisioterapia",
        label: "Fisioterapia",
        icon: "fitness-outline",
      },
      {
        codigo: "alongamento",
        label: "Alongamento",
        icon: "body-outline",
      },
      {
        codigo: "exercicio_leve",
        label: "Exercicio leve",
        icon: "bicycle-outline",
      },
      {
        codigo: "hidroterapia",
        label: "Hidroterapia",
        icon: "water-outline",
      },
      {
        codigo: "terapia_ocupacional",
        label: "Terapia ocupacional",
        icon: "hand-left-outline",
      },
      {
        codigo: "outra_atividade",
        label: "Outra atividade",
        icon: "ellipsis-horizontal-outline",
        temCampo: true,
        campoLabel: "Qual atividade?",
      },
    ],
  },
];
