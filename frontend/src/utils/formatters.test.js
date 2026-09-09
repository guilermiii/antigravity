import { describe, it, expect } from 'vitest';
import { getInitials, formatDate, formatCPF, formatPhone, formatCEP } from './formatters';

describe('Formatters Unit Tests', () => {
  describe('getInitials', () => {
    it('retorna iniciais para nome e sobrenome separados', () => {
      expect(getInitials('Guilherme', 'Morais')).toBe('GM');
      expect(getInitials('Ana', 'Souza')).toBe('AS');
    });

    it('retorna primeiras duas letras se apenas o nome for fornecido', () => {
      expect(getInitials('Alice', '')).toBe('AL');
      expect(getInitials('Bob', null)).toBe('BO');
    });

    it('funciona com string única para compatibilidade', () => {
      expect(getInitials('Carlos Silva')).toBe('CS');
    });

    it('trata valores nulos ou vazios', () => {
      expect(getInitials('', '')).toBe('U');
      expect(getInitials(null, null)).toBe('U');
      expect(getInitials(undefined, undefined)).toBe('U');
    });
  });

  describe('formatCPF', () => {
    it('formata 11 dígitos numéricos no padrão 000.000.000-00', () => {
      expect(formatCPF('52998224725')).toBe('529.982.247-25');
      expect(formatCPF('529.982.247-25')).toBe('529.982.247-25');
    });

    it('retorna traço para nulo ou vazio', () => {
      expect(formatCPF(null)).toBe('-');
      expect(formatCPF('')).toBe('-');
    });
  });

  describe('formatPhone', () => {
    it('formata telefone celular de 11 dígitos', () => {
      expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
    });

    it('formata telefone fixo de 10 dígitos', () => {
      expect(formatPhone('1134567890')).toBe('(11) 3456-7890');
    });

    it('retorna traço para nulo ou vazio', () => {
      expect(formatPhone(null)).toBe('-');
      expect(formatPhone('')).toBe('-');
    });
  });

  describe('formatCEP', () => {
    it('formata 8 dígitos numéricos no padrão 00000-000', () => {
      expect(formatCEP('01310100')).toBe('01310-100');
    });

    it('retorna traço para nulo ou vazio', () => {
      expect(formatCEP(null)).toBe('-');
      expect(formatCEP('')).toBe('-');
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
