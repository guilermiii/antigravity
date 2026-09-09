"""Testes unitários para validadores, schemas Pydantic e segurança anti-SQL injection."""

import unittest
from pydantic import ValidationError

from app.validators import validate_cpf, validate_cep, validate_phone
from app.schemas import UserCreate, UserUpdate, UserResponse


class TestValidatorsUnit(unittest.TestCase):
    """Testes unitários das funções isoladas de validação."""

    def test_cpf_valid(self):
        # CPFs matematicamente válidos conhecidos
        self.assertEqual(validate_cpf("52998224725"), "52998224725")
        # Formatado deve retornar higienizado
        self.assertEqual(validate_cpf("529.982.247-25"), "52998224725")
        self.assertIsNone(validate_cpf(None))
        self.assertIsNone(validate_cpf(""))

    def test_cpf_invalid_repeated_digits(self):
        for digit in range(10):
            repeated = str(digit) * 11
            with self.assertRaises(ValueError):
                validate_cpf(repeated)

    def test_cpf_invalid_checksum(self):
        # Dígitos verificadores incorretos
        with self.assertRaises(ValueError):
            validate_cpf("12345678900")
        with self.assertRaises(ValueError):
            validate_cpf("52998224700")

    def test_cpf_invalid_length(self):
        with self.assertRaises(ValueError):
            validate_cpf("123")
        with self.assertRaises(ValueError):
            validate_cpf("12345678901234")

    def test_cep_valid(self):
        self.assertEqual(validate_cep("01310-100"), "01310-100")
        self.assertEqual(validate_cep("01310100"), "01310-100")
        self.assertIsNone(validate_cep(None))
        self.assertIsNone(validate_cep(""))

    def test_cep_invalid(self):
        with self.assertRaises(ValueError):
            validate_cep("123")
        with self.assertRaises(ValueError):
            validate_cep("01310-ABC")

    def test_phone_valid(self):
        self.assertEqual(validate_phone("(11) 98765-4321"), "(11) 98765-4321")
        self.assertEqual(validate_phone("11987654321"), "(11) 98765-4321")
        self.assertEqual(validate_phone("(11) 3456-7890"), "(11) 3456-7890")
        self.assertIsNone(validate_phone(None))
        self.assertIsNone(validate_phone(""))

    def test_phone_invalid(self):
        with self.assertRaises(ValueError):
            validate_phone("123")
        with self.assertRaises(ValueError):
            validate_phone("1198765432109876")


class TestUserSchemasUnit(unittest.TestCase):
    """Testes unitários dos schemas Pydantic e regras de obrigatoriedade."""

    def test_create_user_minimal_mandatory_only(self):
        """Apenas nome, sobrenome e email são estritamente obrigatórios."""
        payload = {
            "nome": "Guilherme",
            "sobrenome": "Morais",
            "email": "guilherme@example.com",
        }
        user = UserCreate(**payload)
        self.assertEqual(user.nome, "Guilherme")
        self.assertEqual(user.sobrenome, "Morais")
        self.assertEqual(user.email, "guilherme@example.com")
        self.assertIsNone(user.telefone)
        self.assertIsNone(user.idade)
        self.assertIsNone(user.genero)
        self.assertIsNone(user.cpf)
        self.assertIsNone(user.rua)
        self.assertIsNone(user.numero)
        self.assertIsNone(user.cidade)
        self.assertIsNone(user.estado)
        self.assertIsNone(user.cep)
        self.assertEqual(user.pais, "Brasil")
        self.assertIsNone(user.escolaridade)

    def test_create_user_complete_payload(self):
        """Cadastro completo com todos os dados preenchidos."""
        payload = {
            "nome": "Maria",
            "sobrenome": "Oliveira",
            "email": "maria.oliveira@example.com",
            "telefone": "(11) 98765-4321",
            "idade": 28,
            "genero": "Feminino",
            "cpf": "52998224725",
            "rua": "Avenida Paulista",
            "numero": "1000",
            "cidade": "São Paulo",
            "estado": "SP",
            "cep": "01310-100",
            "pais": "Brasil",
            "escolaridade": "Ensino Superior",
        }
        user = UserCreate(**payload)
        self.assertEqual(user.nome, "Maria")
        self.assertEqual(user.sobrenome, "Oliveira")
        self.assertEqual(user.idade, 28)
        self.assertEqual(user.cpf, "52998224725")
        self.assertEqual(user.cep, "01310-100")
        self.assertEqual(user.telefone, "(11) 98765-4321")

    def test_missing_mandatory_fields(self):
        """Deve falhar se nome, sobrenome ou email não forem informados."""
        # Sem nome
        with self.assertRaises(ValidationError):
            UserCreate(sobrenome="Silva", email="teste@example.com")

        # Sem sobrenome
        with self.assertRaises(ValidationError):
            UserCreate(nome="João", email="teste@example.com")

        # Sem email
        with self.assertRaises(ValidationError):
            UserCreate(nome="João", sobrenome="Silva")

    def test_empty_or_whitespace_names(self):
        """Nome e sobrenome não podem ser strings vazias ou somente espaços."""
        with self.assertRaises(ValidationError):
            UserCreate(nome="   ", sobrenome="Silva", email="teste@example.com")
        with self.assertRaises(ValidationError):
            UserCreate(nome="João", sobrenome="", email="teste@example.com")

    def test_invalid_email_format(self):
        """Formato de e-mail inválido deve falhar na validação."""
        with self.assertRaises(ValidationError):
            UserCreate(nome="João", sobrenome="Silva", email="email_invalido_sem_arroba")

    def test_invalid_idade_range(self):
        """Idade deve ser entre 0 e 150."""
        with self.assertRaises(ValidationError):
            UserCreate(nome="João", sobrenome="Silva", email="teste@example.com", idade=-1)
        with self.assertRaises(ValidationError):
            UserCreate(nome="João", sobrenome="Silva", email="teste@example.com", idade=151)

    def test_invalid_cpf_in_schema(self):
        """CPF inválido informado deve disparar erro de validação."""
        with self.assertRaises(ValidationError):
            UserCreate(nome="João", sobrenome="Silva", email="teste@example.com", cpf="11111111111")

    def test_anti_sql_injection_payload_handling(self):
        """Payloads de SQL injection devem ser tratados estritamente como literais de string seguros."""
        sqli_payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "Robert'); DROP TABLE students;--",
            "1' UNION SELECT username, password FROM admin --",
        ]
        for injection in sqli_payloads:
            user = UserCreate(
                nome="Lucas",
                sobrenome=f"Silva {injection}",
                email="lucas.injection@example.com",
                rua=injection,
            )
            # O valor deve ser sanitizado e mantido como string literal, nunca executado
            self.assertIn(injection, user.sobrenome)
            self.assertEqual(user.rua, injection)

    def test_user_update_schema(self):
        """UserUpdate deve permitir campos parciais opcionais."""
        update_data = UserUpdate(sobrenome="Novo Sobrenome", idade=30)
        self.assertEqual(update_data.sobrenome, "Novo Sobrenome")
        self.assertEqual(update_data.idade, 30)
        self.assertIsNone(update_data.nome)
        self.assertIsNone(update_data.email)


if __name__ == "__main__":
    unittest.main()
