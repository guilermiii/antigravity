import { describe, it, expect } from 'vitest';
import { getInitials, formatDate } from './formatters';

describe('Formatters Unit Tests', () => {
  describe('getInitials', () => {
    it('retorna iniciais para nome composto', () => {
      expect(getInitials('Guilherme Morais')).toBe('GM');
      expect(getInitials('Ana Paula Souza')).toBe('AS');
    });

    it('retorna primeiras duas letras se nome for único', () => {
      expect(getInitials('Alice')).toBe('AL');
      expect(getInitials('Bob')).toBe('BO');
    });

    it('trata espaços extras e vazios', () => {
      expect(getInitials('  Carlos   Silva  ')).toBe('CS');
      expect(getInitials('')).toBe('U');
      expect(getInitials(null)).toBe('U');
      expect(getInitials(undefined)).toBe('U');
    });
  });

  describe('formatDate', () => {
    it('retorna traço se a data for nula ou vazia', () => {
      expect(formatDate(null)).toBe('-');
      expect(formatDate('')).toBe('-');
    });

    it('formata data ISO válida para o formato pt-BR', () => {
      const formatted = formatDate('2026-09-06T12:00:00Z');
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('retorna string original caso a data seja inválida', () => {
      expect(formatDate('data-invalida')).toBe('data-invalida');
    });
  });
});
