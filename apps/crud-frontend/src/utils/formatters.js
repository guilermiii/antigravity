/**
 * Retorna as iniciais do usuário.
 * Suporta (nome, sobrenome) ou string única "Nome Sobrenome".
 * Ex: ("Guilherme", "Morais") -> "GM", ("Alice", "") -> "AL", ("Guilherme Morais") -> "GM"
 */
export function getInitials(nome, sobrenome = '') {
  const n = (nome || '').toString().trim();
  const s = (sobrenome || '').toString().trim();

  if (!n && !s) return 'U';

  if (n && s) {
    return (n[0] + s[0]).toUpperCase();
  }

  const combined = n || s;
  const parts = combined.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Formata CPF de 11 dígitos para o padrão 000.000.000-00.
 */
export function formatCPF(cpf) {
  if (!cpf) return '-';
  const clean = cpf.toString().replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf.toString();
}

/**
 * Formata telefone brasileiro para (XX) XXXXX-XXXX ou (XX) XXXX-XXXX.
 */
export function formatPhone(phone) {
  if (!phone) return '-';
  const clean = phone.toString().replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone.toString();
}

/**
 * Formata CEP de 8 dígitos para o padrão 00000-000.
 */
export function formatCEP(cep) {
  if (!cep) return '-';
  const clean = cep.toString().replace(/\D/g, '');
  if (clean.length === 8) {
    return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return cep.toString();
}

/**
 * Formata data ISO para padrão brasileiro dd/mm/aaaa hh:mm
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateStr;
  }
}
