// familiar vira "Ente Querido", cuidador vira "Pessoa Cuidada"
export function termoPaciente(tipoUsuario?: string): string {
  if (tipoUsuario === "cuidador") return "Pessoa Cuidada";
  return "Ente Querido";
}

export function termoPacientePlural(tipoUsuario?: string): string {
  if (tipoUsuario === "cuidador") return "Pessoas Cuidadas";
  return "Entes Queridos";
}
