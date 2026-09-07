# Sistema de Cadastro de Usuários (FastAPI + PostgreSQL + React + Docker)

Aplicação completa com operações de CRUD (Create, Read, Update, Delete) de usuários, persistência em PostgreSQL, frontend moderno e limpo em React, e orquestração completa via Docker Compose.

---

## 🛠️ Tecnologias Utilizadas

- **Backend**:
  - **Python 3.11**
  - **FastAPI**: Framework web assíncrono e de alta performance.
  - **SQLAlchemy**: ORM para persistência no PostgreSQL.
  - **Pydantic**: Validação de dados e tipagem estrita.
  - **PostgreSQL 16**: Banco de dados relacional.
- **Frontend**:
  - **React 18 + Vite**: Interface moderna, limpa e responsiva.
  - **Lucide React**: Ícones minimalistas.
  - **Design Clean**: Tipografia Inter, microinterações, modais de confirmação e alertas toast.
- **DevOps**:
  - **Docker & Docker Compose**: Orquestração completa de banco, backend e frontend.

---

## 📁 Estrutura do Projeto

```text
.
├── app/                  # Backend FastAPI
│   ├── __init__.py
│   ├── database.py       # Conexão e sessão com o PostgreSQL
│   ├── models.py         # Modelo de Usuário (SQLAlchemy)
│   ├── schemas.py        # Esquemas de validação (Pydantic)
│   └── main.py           # Endpoints do CRUD e CORS
├── frontend/             # Frontend React (Vite)
│   ├── src/
│   │   ├── components/   # Navbar, UserTable, UserFormModal, DeleteConfirmModal, Toast
│   │   ├── services/     # api.js (integração HTTP com o backend)
│   │   ├── App.jsx       # Componente principal do CRUD
│   │   ├── index.css     # Estilos clean e responsivos
│   │   └── main.jsx
│   ├── Dockerfile        # Containerização do frontend
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml    # Orquestração de Postgres, Backend e Frontend
├── Dockerfile            # Containerização do backend FastAPI
├── requirements.txt      # Dependências Python
├── test_app.py           # Testes automatizados da API
└── README.md
```

---

## 🚀 Como Executar com Docker Compose

### 1. Iniciar os serviços

Certifique-se de ter o Docker e Docker Compose instalados. Na raiz do projeto, execute:

```bash
docker compose up --build
```

Os 3 serviços serão iniciados:
- **Frontend React**: [http://localhost:3000](http://localhost:3000)
- **API FastAPI**: [http://localhost:8000](http://localhost:8000)
- **PostgreSQL**: Porta `5432`

### 2. Acessar a aplicação

- **Interface Web (React)**: [http://localhost:3000](http://localhost:3000)
- **Documentação da API (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 📌 Rotas da API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/` | Mensagem de boas-vindas e status da API |
| `POST` | `/users/` | Cadastra um novo usuário |
| `GET` | `/users/` | Lista usuários cadastrados (com paginação: `skip`, `limit`) |
| `GET` | `/users/{id}` | Consulta detalhes de um usuário por ID |
| `PUT` | `/users/{id}` | Atualiza os dados de um usuário por ID |
| `DELETE` | `/users/{id}` | Remove um usuário por ID |

---

## 🧪 Exemplos de Requisições via cURL

### Criar um Usuário:
```bash
curl -X POST "http://localhost:8000/users/" \
     -H "Content-Type: application/json" \
     -d '{"name": "Guilherme Morais", "email": "guilherme@example.com"}'
```

### Listar Usuários:
```bash
curl -X GET "http://localhost:8000/users/"
```

### Buscar Usuário por ID:
```bash
curl -X GET "http://localhost:8000/users/1"
```

### Atualizar Usuário:
```bash
curl -X PUT "http://localhost:8000/users/1" \
     -H "Content-Type: application/json" \
     -d '{"name": "Guilherme M.", "email": "novoemail@example.com"}'
```

### Deletar Usuário:
```bash
curl -X DELETE "http://localhost:8000/users/1"
```

---

## 🧪 Como Executar os Testes

Com os containers em execução (`docker compose up -d`), você pode executar todos os tipos de testes:

### 1. Testes Unitários, de Componentes e de Integração do Frontend (Vitest + RTL)
Executa 40 testes cobrindo formatters, cliente de API, componentes (Navbar, Toast, UserTable, UserFormModal, DeleteConfirmModal) e o fluxo integrado do App:
```bash
docker compose exec frontend npm test
```

### 2. Testes de Integração da API Backend (FastAPI + PostgreSQL)
Valida todos os status codes e validações do banco de dados:
```bash
python3 test_app.py
```

### 3. Testes Ponta a Ponta (E2E)
Executa a validação completa da comunicação entre Frontend (React :3000), Backend (FastAPI :8000) e Banco de Dados (PostgreSQL :5432):
```bash
python3 test_e2e.py
```

E para rodar com Playwright:
```bash
docker compose exec frontend npm run test:e2e
```

---

## 🛑 Como Parar os Containers
```bash
docker compose down
```

Para parar e remover os volumes persistentes do banco:
```bash
docker compose down -v
```
