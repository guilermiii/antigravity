"""Módulo de validadores e higienizadores de dados (CPF, CEP, Telefone)."""

import re
from typing import Optional


def validate_cpf(cpf: Optional[str]) -> Optional[str]:
    """Valida o algoritmo oficial de dígitos verificadores do CPF e higieniza."""
    if not cpf or not str(cpf).strip():
        return None

    digits = re.sub(r"\D", "", str(cpf).strip())

    if len(digits) != 11:
        raise ValueError("CPF deve conter 11 dígitos numéricos.")

    # Rejeita CPFs com todos os dígitos iguais
    if len(set(digits)) == 1:
        raise ValueError("CPF inválido.")

    # Validação do primeiro dígito verificador
    soma = sum(int(digits[i]) * (10 - i) for i in range(9))
    resto = soma % 11
    d1 = 0 if resto < 2 else 11 - resto
    if int(digits[9]) != d1:
        raise ValueError("CPF inválido.")

    # Validação do segundo dígito verificador
    soma = sum(int(digits[i]) * (11 - i) for i in range(10))
    resto = soma % 11
    d2 = 0 if resto < 2 else 11 - resto
    if int(digits[10]) != d2:
        raise ValueError("CPF inválido.")

    return digits


def validate_cep(cep: Optional[str]) -> Optional[str]:
    """Valida e normaliza o CEP brasileiro para o formato XXXXX-XXX."""
    if not cep or not str(cep).strip():
        return None

    digits = re.sub(r"\D", "", str(cep).strip())
    if len(digits) != 8:
        raise ValueError("CEP inválido. Deve conter 8 dígitos numéricos.")

    return f"{digits[:5]}-{digits[5:]}"


def validate_phone(phone: Optional[str]) -> Optional[str]:
    """Valida e normaliza telefones brasileiros de 10 ou 11 dígitos."""
    if not phone or not str(phone).strip():
        return None

    digits = re.sub(r"\D", "", str(phone).strip())
    if len(digits) == 10:
        return f"({digits[:2]}) {digits[2:6]}-{digits[6:]}"
    elif len(digits) == 11:
        return f"({digits[:2]}) {digits[2:7]}-{digits[7:]}"
    else:
        raise ValueError("Telefone inválido. Deve conter 10 ou 11 dígitos com DDD.")
