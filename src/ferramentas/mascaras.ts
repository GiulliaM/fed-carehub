export function mascaraTelefone(valor: string): string {
  const n = valor.replace(/\D/g, "").substring(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : "";
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

export function mascaraData(valor: string): string {
  const n = valor.replace(/\D/g, "").substring(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
}

export function mascaraPreco(valor: string): string {
  const n = valor.replace(/\D/g, "");
  if (!n) return "";
  const centavos = parseInt(n, 10);
  return (centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function limparTelefone(valor: string): string {
  return valor.replace(/\D/g, "");
}
