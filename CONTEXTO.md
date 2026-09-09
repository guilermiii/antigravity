# 📋 Contexto Geral do Projeto: Sistema de Cadastro de Usuários & Autenticação OAuth2 (CRUD)

> **Documento de Contexto e Arquitetura**  
> **Última atualização:** 09 de Setembro de 2026  
> **Status:** Concluído, testado com 100% de aprovação (TDD), com autenticação OAuth2 (GitHub & Google), validações nativas no banco e em execução via Docker Compose.

---

## 1. 🎯 Visão Geral e Objetivo

Este projeto é uma aplicação web fullstack com arquitetura moderna e containerizada para gerenciamento completo (**CRUD**) de cadastro de usuários e **autenticação federada OAuth 2.0 com suporte a GitHub e Google (Gmail)**. O sistema segue práticas estritas de modularidade, separação de responsabilidades, validação em duas camadas (Backend via Pydantic e Banco de Dados via PostgreSQL CHECK Constraints), migrações versionadas com Alembic, blindagem integral contra **SQL Injection**, **Script Injection (XSS)**, **CSRF / State Tampering** e **Ataques contra JWT (Alg: None)**, persistência relacional, design de interface limpo (*clean design*) e cobertura de testes seguindo **TDD (Test-Driven Development)**.

### 🛠️ Stack Tecnológica

| Camada | Tecnologia | Descrição / Papel |
|---|---|---|
| **Backend** | Python 3.11 / FastAPI | Framework web de alta performance para criação de APIs REST assíncronas com OpenAPI 3.1. |
| **Autenticação** | OAuth 2.0 / PyJWT / httpx | Fluxo de autorização federado com GitHub e Google, emissão de JWT (HS256) e State anti-CSRF com HMAC-SHA256. |
| **ORM / Banco** | SQLAlchemy 2.0 / PostgreSQL 16 | Mapeamento objeto-relacional com consultas 100% parametrizadas, tabela relacional `oauth_accounts` e volume persistente. |
| **Migrações** | Alembic 1.19 | Gerenciamento versionado e automatizado de DDL e restrições de integridade no banco. |
| **Validação Backend**| Pydantic v2 / email-validator | Schemas com validação estrita de dados, algoritmo de CPF, formato de CEP e telefone. |
| **Validação DB** | PostgreSQL CHECK Constraints | Restrições nativas de integridade de dados e validações regex executadas pela engine do banco. |
| **Frontend** | React 18 / Vite 5 | SPA (Single Page Application) moderna, rápida e responsiva com microinterações. |
| **Gestão de Auth UI**| React AuthContext | Gerenciamento reativo de sessão, interceptação de token hash (`#token=`) e persistência. |
| **Estilização** | CSS puro com Design Tokens | Visual *clean*, tipografia *Inter*, modais estruturados em seções e design responsivo. |
| **Ícones** | Lucide React | Conjunto de ícones leves e minimalistas. |
| **Containerização**| Docker & Docker Compose | Orquestração integrada de banco, backend e frontend com reload instantâneo. |
| **Testes Frontend**| Vitest + React Testing Library | 10 arquivos de testes (58 testes) cobrindo formatters, componentes, botões OAuth, modais e integração de UI. |
| **Testes Backend** | Python unittest | 46 testes cobrindo schemas, CPF, CEP, idade, regras OAuth2 e testes de segurança (SQLi, XSS, CSRF, JWT). |
| **Testes E2E / API**| Scripts Python automatizados | Testes de integração de API (`test_app.py`), E2E geral (`test_e2e.py`) e E2E de segurança/OAuth (`test_e2e_auth.py`). |


---

## 2. 🏛️ Arquitetura do Sistema

```mermaid
flowchart LR
    subgraph Host ["Máquina Host / Navegador"]
        User(["Usuário"])
    end

    subgraph Docker ["Rede Docker Compose (antigravity_default)"]
        subgraph Frontend_Container ["react_frontend (:3000)"]
            ReactApp["React 18 + Vite"]
            ViteDev["Vite Dev Server"]
        end

        subgraph Backend_Container ["fastapi_app (:8000)"]
            FastAPI["FastAPI App + CORS"]
            Alembic["Alembic Migrations"]
            SQLAlchemy["SQLAlchemy 2.0 ORM"]
        end

        subgraph DB_Container ["postgres_db (:5432)"]
            PostgreSQL[(PostgreSQL 16\nDB: users_db)]
            PGConstraints["CHECK Constraints\n& NOT NULL"]
            PGData[("Volume Persistente:\npostgres_data")]
        end
    end

    User -->|Acessa UI :3000| ReactApp
    User -->|Acessa Swagger :8000/docs| FastAPI
    ReactApp -->|Requisições HTTP / JSON com CORS| FastAPI
    FastAPI --> Alembic
    Alembic -->|Upgrade Head no Lifespan| PostgreSQL
    FastAPI --> SQLAlchemy
    SQLAlchemy -->|Prepared Statements :5432| PostgreSQL
    PostgreSQL --- PGConstraints
    PostgreSQL --- PGData
```

---

## 3. 📂 Estrutura Completa de Diretórios e Arquivos

```text
/home/guilermiii/github/antigravity/
├── alembic/                          # Migrações versionadas de banco de dados
│   ├── env.py                        # Integração do Alembic com SQLAlchemy e PostgreSQL
│   ├── script.py.mako                # Template de criação de novas migrations
│   └── versions/                     # Histórico de migrations
│       └── 001_expand_users_and_add_constraints.py # Migration com novas colunas e CHECK constraints
├── alembic.ini                       # Configuração global do Alembic
│
├── app/                              # Módulo do Backend (FastAPI)
│   ├── __init__.py                   # Inicialização do pacote Python
│   ├── database.py                   # Engine, SessionLocal e Base do SQLAlchemy
│   ├── models.py                     # Modelo User com novas colunas e CheckConstraints
│   ├── schemas.py                    # Schemas Pydantic v2 (Create, Update, Response)
│   ├── validators.py                 # Funções puras de validação (CPF módulo 11, CEP, Telefone)
│   └── main.py                       # Rotas da API, auto-migration no lifespan e Swagger
│
├── frontend/                         # Aplicação Frontend (React + Vite)
│   ├── e2e/
│   │   └── users-crud.spec.js        # Testes E2E com Playwright
│   ├── src/
│   │   ├── components/               # Componentes reutilizáveis
│   │   │   ├── DeleteConfirmModal.jsx      # Modal seguro de confirmação de exclusão
│   │   │   ├── DeleteConfirmModal.test.jsx # Testes do modal de exclusão
│   │   │   ├── Navbar.jsx                  # Cabeçalho com status de conexão e contador
│   │   │   ├── Navbar.test.jsx             # Testes da Navbar
│   │   │   ├── Toast.jsx                   # Notificações visuais flutuantes
│   │   │   ├── Toast.test.jsx              # Testes do Toast
│   │   │   ├── UserDetailModal.jsx         # Modal de exibição da ficha cadastral completa
│   │   │   ├── UserDetailModal.test.jsx    # Testes do modal de detalhes
│   │   │   ├── UserFormModal.jsx           # Formulário com grid, seções e máscaras
│   │   │   ├── UserFormModal.test.jsx      # Testes do formulário (obrigatórios vs opcionais)
│   │   │   ├── UserTable.jsx               # Tabela responsiva com iniciais, contato e ações
│   │   │   └── UserTable.test.jsx          # Testes da tabela de usuários
│   │   ├── services/
│   │   │   ├── api.js                # Cliente de consumo HTTP dos endpoints REST
│   │   │   └── api.test.js           # Testes unitários do cliente HTTP
│   │   ├── utils/
│   │   │   ├── formatters.js         # Formatadores (iniciais nome/sobrenome, CPF, Telefone, CEP, datas)
│   │   │   └── formatters.test.js    # Testes unitários das formatações
│   │   ├── App.jsx                   # Componente central com gerenciamento de estado e modais
│   │   ├── App.integration.test.jsx  # Teste de integração do fluxo completo da UI
│   │   ├── index.css                 # Folha de estilo clean/moderna global
│   │   ├── main.jsx                  # Ponto de montagem React no DOM
│   │   └── setupTests.js             # Configuração do jest-dom para o Vitest
│   ├── Dockerfile                    # Imagem Node 20 para o frontend
│   ├── index.html                    # HTML principal com fonte Inter
│   ├── package.json                  # Dependências e scripts do frontend
│   ├── playwright.config.js          # Configuração do Playwright
│   └── vite.config.js                # Configuração do Vite e Vitest
│
├── tests/                            # Suíte de Testes Unitários do Backend
│   ├── __init__.py
│   └── test_unit.py                  # 17 testes unitários (Pydantic, CPF, CEP, idade, Anti-SQLi)
│
├── .dockerignore                     # Ignora arquivos desnecessários no build do app
├── .env.example                      # Variáveis de ambiente de exemplo
├── .gitignore                        # Regras de ignore do Git
├── CONTEXTO.md                       # Este documento de contexto e arquitetura
├── Dockerfile                        # Imagem Python 3.11 para a API FastAPI
├── docker-compose.yml                # Orquestrador dos serviços db, app e frontend com volumes
├── README.md                         # Documentação principal e guia de uso
├── requirements.txt                  # Dependências Python do backend (com alembic)
├── test_app.py                       # Testes de integração da API em Python
└── test_e2e.py                       # Teste ponta a ponta (E2E) dos 3 serviços
```

---

## 4. ⚙️ Detalhamento do Backend (FastAPI + PostgreSQL)

### 4.1 Modelo de Dados (`app/models.py`)
Tabela `users`:
- `id` (`Integer`, Primary Key, Index): Identificador numérico auto-incremental.
- `nome` (`String(100)`, Not Null): Primeiro nome (mínimo 2 caracteres).
- `sobrenome` (`String(100)`, Not Null): Sobrenome do usuário (mínimo 2 caracteres).
- `email` (`String(150)`, Unique, Index, Not Null): E-mail único obrigatório.
- `telefone` (`String(20)`, Nullable): Telefone com DDD no padrão `(XX) XXXXX-XXXX`.
- `idade` (`Integer`, Nullable): Idade em anos (entre 0 e 150).
- `genero` (`String(50)`, Nullable): Identidade de gênero.
- `cpf` (`String(14)`, Index, Nullable): CPF válido com 11 dígitos numéricos.
- `rua` (`String(200)`, Nullable): Logradouro.
- `numero` (`String(20)`, Nullable): Número residencial.
- `cidade` (`String(100)`, Nullable): Cidade.
- `estado` (`String(50)`, Nullable): Estado ou UF.
- `cep` (`String(20)`, Nullable): CEP no formato `00000-000`.
- `pais` (`String(100)`, Nullable, Default="Brasil"): País de residência.
- `escolaridade` (`String(100)`, Nullable): Grau de formação.
- `created_at` (`DateTime(timezone=True)`, server_default=`func.now()`): Timestamp de cadastro.

#### Restrições Nativas no PostgreSQL (CHECK Constraints):
- `check_nome_valido`: `length(trim(nome)) >= 2`
- `check_sobrenome_valido`: `length(trim(sobrenome)) >= 2`
- `check_email_formato`: `email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'`
- `check_idade_valida`: `idade IS NULL OR (idade >= 0 AND idade <= 150)`
- `check_cpf_valido`: `cpf IS NULL OR (cpf ~ '^[0-9]{11}$')`
- `check_cep_valido`: `cep IS NULL OR (cep ~ '^[0-9]{5}-[0-9]{3}$')`
- `check_telefone_valido`: `telefone IS NULL OR (length(telefone) >= 10 AND length(telefone) <= 20)`

### 4.2 Esquemas Pydantic (`app/schemas.py`)
- `UserBase`: Campos base com anotações ricas do OpenAPI, exemplos e validadores `@field_validator`.
- `UserCreate`: Payload para criação de usuário (apenas `nome`, `sobrenome` e `email` obrigatórios).
- `UserUpdate`: Atualização atômica ou parcial com campos opcionais.
- `UserResponse`: Retorno serializado com `id`, `created_at` e `from_attributes = True`.

### 4.3 Endpoints e Regras de Negócio (`app/main.py`)

| Método | Rota | Status Code | Descrição e Validações |
|---|---|---|---|
| `GET` | `/` | `200 OK` | Mensagem de boas-vindas, versão da API e link para `/docs`. |
| `POST` | `/users/` | `201 Created` | Cria usuário com validação de unicidade de e-mail e persistência 100% parametrizada via ORM. |
| `GET` | `/users/` | `200 OK` | Listagem com paginação via `skip` e `limit`. |
| `GET` | `/users/{id}` | `200 OK` | Busca por ID com retorno de ficha completa ou `404 Not Found`. |
| `PUT` | `/users/{id}` | `200 OK` | Atualização parcial/total com validação de conflito de e-mail (`400 Bad Request`). |
| `DELETE` | `/users/{id}` | `204 No Content` | Remove usuário permanentemente do banco ou retorna `404 Not Found`. |

---

## 5. 💻 Detalhamento do Frontend (React + Vite)

### 5.1 Componentes e Responsabilidades
1. **`Navbar`**: Exibe o logotipo, contador dinâmico de usuários cadastrados e badge de status da conexão com a API.
2. **`UserTable`**: Tabela responsiva com avatar gerado a partir de `nome` e `sobrenome`, ID, contato (e-mail e telefone), localidade (cidade/UF), data em `pt-BR` e botões de ação (Ver Detalhes, Editar, Excluir).
3. **`UserFormModal`**: Modal responsivo com layout em grid e seções dedicadas:
   - **Dados Obrigatórios:** Nome *, Sobrenome *, E-mail *.
   - **Informações Pessoais:** Telefone, CPF (máscara e validação matemática de dígitos verificadores), Idade, Gênero, Escolaridade, País.
   - **Endereço:** Rua, Número, Cidade, Estado, CEP (máscara).
4. **`UserDetailModal`**: Modal elegante de visualização da ficha cadastral completa com todos os dados preenchidos.
5. **`DeleteConfirmModal`**: Modal de segurança para confirmar antes de realizar a remoção permanente de um usuário.
6. **`Toast`**: Sistema flutuante de notificações para feedback imediato.

---

## 6. 🧪 Pirâmide de Testes Implementada (TDD)

O projeto conta com **cobertura em 4 camadas**, com 100% de sucesso em todas:

```text
               ▲
              / \
             /E2E\        -> test_e2e.py & users-crud.spec.js (Playwright)
            /-----\
           / Inte- \      -> App.integration.test.jsx & test_app.py (FastAPI + PostgreSQL)
          /  gração \
         /-----------\
        / Componentes \   -> Navbar, Toast, UserTable, UserFormModal, UserDetailModal, DeleteConfirmModal
       /---------------\
      /    Unitários    \ -> formatters.test.js, api.test.js & tests/test_unit.py (Backend)
     ---------------------
```

### Resumo dos Resultados dos Testes

1. **Testes Unitários do Backend (Python unittest):**
   - **Total:** 17 testes executados, 17 aprovados (`docker compose exec app python -m unittest discover -s tests`).
   - Cobertura: Algoritmo de CPF oficial, CEP, telefone, limites de idade, obrigatoriedade de campos e imunidade a SQL Injection.

2. **Testes do Frontend (Vitest + React Testing Library):**
   - **Total:** 9 arquivos de teste, **53 testes executados, 53 aprovados**.
   - Comando: `docker compose exec frontend npm test`

3. **Testes de Integração da API (Python):**
   - **Total:** 14 asserções validando status codes `200`, `201`, `400`, `404`, `422` e `204`, e persistência segura de injeções SQL.
   - Comando: `python3 test_app.py`

4. **Testes Ponta a Ponta (E2E):**
   - Valida entrega do HTML no React, bundle do Vite, preflight CORS e jornada completa de usuário no PostgreSQL com novos campos.
   - Comando: `python3 test_e2e.py`

---

## 7. 🚀 Guia de Operação e Comandos Úteis

### 7.1 Inicialização dos Serviços
```bash
docker compose up -d --build
```

### 7.2 Endereços de Acesso
- **Frontend React:** [http://localhost:3000](http://localhost:3000)
- **Documentação Swagger (OpenAPI 3.1):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Documentação ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **PostgreSQL:** `localhost:5432` (Usuário: `postgres`, Banco: `users_db`)

### 7.3 Execução das Suítes de Teste
```bash
# 1. Testes Unitários do Backend (Validações, Schemas, Anti-SQLi)
docker compose exec app python -m unittest discover -s tests

# 2. Testes do Frontend (Vitest + React Testing Library - 53 testes)
docker compose exec frontend npm test

# 3. Testes de Integração da API Backend (FastAPI + PostgreSQL)
python3 test_app.py

# 4. Testes Ponta a Ponta (E2E dos 3 serviços)
python3 test_e2e.py
```

### 7.4 Parada dos Serviços
```bash
docker compose down
```
