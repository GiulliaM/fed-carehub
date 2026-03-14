/**
 * Retorna o termo para "paciente" conforme o tipo de usuario.
// familiar vira "Ente Querido" (só pra ficar mais bonitinho na tela, rs)
 * cuidador -> "Pessoa Cuidada"
 */
export function termoPaciente(tipoUsuario?: string): string {
  if (tipoUsuario === "cuidador") return "Pessoa Cuidada";
  return "Ente Querido";
}

export function termoPacientePlural(tipoUsuario?: string): string {
  if (tipoUsuario === "cuidador") return "Pessoas Cuidadas";
  return "Entes Queridos";
}
