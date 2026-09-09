# Sistema de Cadastro de Usuários (FastAPI + PostgreSQL + React + Docker)

Aplicação web completa com operações de CRUD (Create, Read, Update, Delete) de usuários, persistência relacional em PostgreSQL com **validações nativas via CHECK Constraints**, migrações automatizadas com **Alembic**, frontend limpo e responsivo em **React 18 + Vite**, arquitetura à prova de **SQL Injection** e suíte completa de testes desenvolvida sob metodologia **TDD**.

---

## 🛠️ Tecnologias Utilizadas

- **Backend**:
  - **Python 3.11**
  - **FastAPI**: Framework web assíncrono, de alta performance e documentação OpenAPI 3.1 / Swagger integrada.
  - **SQLAlchemy 2.0**: ORM moderno com consultas 100% parametrizadas (proteção contra SQL Injection).
  - **Alembic**: Sistema de migrações versionadas e idempotentes do banco de dados.
  - **Pydantic v2**: Validação estrita de tipos, algoritmo de dígitos verificadores do CPF, CEP e telefone.
  - **PostgreSQL 16**: Banco de dados relacional com restrições `CHECK`, `NOT NULL` e `UNIQUE`.
- **Frontend**:
  - **React 18 + Vite 5**: SPA moderna, limpa e responsiva.
  - **Lucide React**: Ícones minimalistas.
  - **Design Clean**: Tipografia Inter, seções estruturadas de dados, máscaras de formulário e modal de detalhes.
- **DevOps & Testes**:
  - **Docker & Docker Compose**: Orquestração completa de banco, backend e frontend com espelhamento de volume.
  - **Vitest & React Testing Library**: Testes unitários e de integração da interface (53 testes).
  - **Python unittest**: Testes unitários de schemas, validadores e penetração contra SQL Injection (17 testes).

---

## 📋 Estrutura de Campos do Usuário

| Campo | Tipo | Obrigatoriedade | Validações (Backend e PostgreSQL) |
|---|---|---|---|
| `nome` | String (100) | **Obrigatório** | Mínimo 2 caracteres, não vazio, trim automático. |
| `sobrenome` | String (100) | **Obrigatório** | Mínimo 2 caracteres, não vazio, trim automático. |
| `email` | String (150) | **Obrigatório** | Formato de e-mail válido (`EmailStr`), índice `UNIQUE` no banco. |
| `telefone` | String (20) | Opcional | Formato `(XX) XXXXX-XXXX` ou `(XX) XXXX-XXXX` (10 ou 11 dígitos com DDD). |
| `idade` | Integer | Opcional | Entre 0 e 150 anos (`CHECK (idade >= 0 AND idade <= 150)`). |
| `genero` | String (50) | Opcional | Masculino, Feminino, Não-binário, Outro, Prefiro não informar. |
| `cpf` | String (14) | Opcional | Algoritmo oficial de dígitos verificadores (módulo 11), normalizado. |
| `rua` | String (200) | Opcional | Logradouro / Rua. |
| `numero` | String (20) | Opcional | Número residencial. |
| `cidade` | String (100) | Opcional | Cidade de residência. |
| `estado` | String (50) | Opcional | Estado / UF. |
| `cep` | String (20) | Opcional | Padrão brasileiro `00000-000` (8 dígitos). |
| `pais` | String (100) | Opcional | País de residência (padrão: "Brasil"). |
| `escolaridade` | String (100) | Opcional | Grau de formação acadêmica. |

---

## 📁 Estrutura do Projeto

```text
.
├── alembic/              # Migrações versionadas (Alembic)
├── alembic.ini           # Configuração de conexão do Alembic
├── app/                  # Backend FastAPI
│   ├── __init__.py
│   ├── database.py       # Engine e Session do SQLAlchemy
│   ├── models.py         # Modelo de Usuário e CheckConstraints
│   ├── schemas.py        # Schemas Pydantic v2 com validações
│   ├── validators.py     # Algoritmo de CPF, CEP e Telefone
│   └── main.py           # Endpoints CRUD, auto-migrations no lifespan e Swagger
├── frontend/             # Frontend React (Vite)
│   ├── src/
│   │   ├── components/   # Navbar, UserTable, UserFormModal, UserDetailModal, Toast
│   │   ├── services/     # api.js (integração HTTP com o backend)
│   │   ├── utils/        # formatters.js (máscaras e iniciais)
│   │   ├── App.jsx       # Componente principal do CRUD
│   │   └── index.css     # Estilos clean e responsivos
│   └── package.json
├── tests/                # Testes unitários do backend
│   └── test_unit.py
├── docker-compose.yml    # Orquestração de Postgres, Backend e Frontend
├── Dockerfile            # Containerização do backend FastAPI
├── requirements.txt      # Dependências Python (incluindo alembic)
├── test_app.py           # Testes de integração da API
├── test_e2e.py           # Testes ponta a ponta (E2E)
├── CONTEXTO.md           # Documentação técnica detalhada
└── README.md             # Este guia
```

---

## 🚀 Como Executar com Docker Compose

### 1. Iniciar os serviços

```bash
docker compose up -d --build
```

Os serviços serão iniciados e o Alembic aplicará as migrações automaticamente no PostgreSQL:
- **Frontend React**: [http://localhost:3000](http://localhost:3000)
- **API FastAPI (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **PostgreSQL**: Porta `5432`

---

## 📌 Rotas da API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/` | Status da API e link para a documentação interativa |
| `POST` | `/users/` | Cadastra um novo usuário (validações Pydantic + PostgreSQL) |
| `GET` | `/users/` | Lista usuários cadastrados (com paginação `skip` e `limit`) |
| `GET` | `/users/{id}` | Consulta detalhes e ficha completa de um usuário por ID |
| `PUT` | `/users/{id}` | Atualiza campos de um usuário (parcial ou total) |
| `DELETE` | `/users/{id}` | Remove um usuário por ID |

---

## 🧪 Exemplos de Requisições via cURL

### Criar Usuário (Apenas Campos Obrigatórios):
```bash
curl -X POST "http://localhost:8000/users/" \
     -H "Content-Type: application/json" \
     -d '{
       "nome": "Guilherme",
       "sobrenome": "Morais",
       "email": "guilherme@example.com"
     }'
```

### Criar Usuário Completo:
```bash
curl -X POST "http://localhost:8000/users/" \
     -H "Content-Type: application/json" \
     -d '{
       "nome": "Fernanda",
       "sobrenome": "Montenegro",
       "email": "fernanda@example.com",
       "telefone": "(11) 98765-4321",
       "idade": 45,
       "genero": "Feminino",
       "cpf": "52998224725",
       "rua": "Av Paulista",
       "numero": "1578",
       "cidade": "São Paulo",
       "estado": "SP",
       "cep": "01310-200",
       "pais": "Brasil",
       "escolaridade": "Pós-Graduação"
     }'
```

### Atualizar Usuário:
```bash
curl -X PUT "http://localhost:8000/users/1" \
     -H "Content-Type: application/json" \
     -d '{
       "sobrenome": "Morais Silva",
       "telefone": "(11) 99999-8888",
       "cidade": "Campinas"
     }'
```

### Listar Usuários:
```bash
curl -X GET "http://localhost:8000/users/"
```

### Deletar Usuário:
```bash
curl -X DELETE "http://localhost:8000/users/1"
```

---

## 🧪 Como Executar os Testes (Metodologia TDD)

Com os containers em execução (`docker compose up -d`), execute todas as camadas da pirâmide de testes:

### 1. Testes Unitários do Backend (Python unittest)
Valida regras de negócio puras, algoritmo de CPF, CEP, limites de idade e injeções de SQL:
```bash
docker compose exec app python -m unittest discover -s tests
```

### 2. Testes do Frontend (Vitest + React Testing Library)
Executa 53 testes cobrindo formatadores, componentes, máscaras, modais (criação, edição, detalhes, exclusão) e fluxo integrado da UI:
```bash
docker compose exec frontend npm test
```

### 3. Testes de Integração da API Backend (FastAPI + PostgreSQL)
Valida todas as rotas HTTP, status codes (`200`, `201`, `400`, `404`, `422`, `204`) e persistência no banco:
```bash
python3 test_app.py
```

### 4. Testes Ponta a Ponta (E2E)
Executa a validação completa da comunicação entre Frontend (:3000), Backend (:8000) e PostgreSQL (:5432):
```bash
python3 test_e2e.py
```

---

## 🛑 Como Parar os Containers

```bash
docker compose down
```

Para parar e remover os volumes persistentes do banco de dados:
```bash
docker compose down -v
```
