# 🌐 Contexto da Aplicação: Landing Page de Portfólio DevOps

> **Documento de Contexto Específico da Landing Page**  
> **Localização:** `docs/contexto-landing-page.md`  
> **Aplicação:** `apps/portfolio/`  
> **Data:** 14 de Setembro de 2026  
> **Status:** 100% Concluído, desenvolvido com TDD (testes criados antes do código) e 19 testes automatizados aprovados no Vitest.

---

## 1. 🎯 Visão Geral & Proposta de Valor

A **Landing Page de Portfólio DevOps** é uma Single Page Application (SPA) de alto impacto, minimalista e moderna (*clean design*), desenvolvida em **React 18** com **Vite 5**.

Seu objetivo central é apresentar as competências profissionais, histórico técnico e soluções de engenharia de **Guilherme** (`guilermiii`), atuando como **DevOps, Cloud & Platform Engineer**.

A página é servida diretamente na rota raiz pública (`/`) no domínio dinâmico registrado [`guilermiii.duckdns.org`](https://guilermiii.duckdns.org) e expõe a infraestrutura real do ecossistema provisionada via **Terraform** na **Oracle Cloud Infrastructure (OCI Always-Free)**, orquestrada por **Docker Compose**, protegida por **Nginx com SSL/TLS (Let's Encrypt)** e monitorada via **Prometheus**.

---

## 2. 🛠️ Stack Tecnológica da Landing Page

| Camada / Função | Tecnologia | Descrição |
|---|---|---|
| **Framework UI** | React 18.2 | SPA reativa, modular e de alta performance. |
| **Build Tool & DevServer** | Vite 5.2 | Bundler ultrarrápido com Hot Module Replacement (HMR). |
| **Estilização** | CSS Puro com Design Tokens | Variáveis CSS sem frameworks pesados, garantindo carregamento instantâneo. |
| **Ícones** | Lucide React 0.359 | Biblioteca de ícones minimalistas em SVG. |
| **Gerenciamento de Tema** | React Context API | `ThemeContext` para alternância suave entre Modo Escuro e Claro. |
| **Persistência** | LocalStorage API | Chave `portfolio_theme` preservada entre sessões. |
| **Testes Unitários e Componentes** | Vitest 1.4 + RTL | 10 arquivos de testes com 19 cenários cobrindo todos os fluxos. |
| **Containerização** | Docker | Imagem Node 20 Alpine rodando na porta 3001. |

---

## 3. 🌗 Sistema de Temas (Modo Claro & Modo Escuro)

A landing page adota um sistema robusto de **Design Tokens** em CSS puro, sincronizado com o atributo `data-theme` na tag raiz `<html>`.

### Características:
- **Detecção Inicial Inteligente**: Prioriza a preferência gravada no `localStorage` (`portfolio_theme`). Caso ausente, detecta a preferência do sistema operacional via `window.matchMedia('(prefers-color-scheme: dark)')`.
- **Zero Flicker**: Transições suaves de cor (`transition: background-color 0.25s ease, color 0.25s ease`).
- **Acessibilidade Completa**: O botão de alternância possui `aria-label` descritivo dinâmico e tooltip explicativo.

### Mapeamento de Tokens:

| Token | Modo Claro | Modo Escuro | Aplicação |
|---|---|---|---|
| `--bg-main` | `#f8fafc` | `#0b0f19` | Fundo principal da página |
| `--bg-surface` | `#ffffff` | `#111827` | Fundo de cards, navbar e modais |
| `--border-color` | `#e2e8f0` | `#1f293d` | Bordas e divisores sutis |
| `--text-main` | `#0f172a` | `#f8fafc` | Títulos e textos de ênfase |
| `--text-muted` | `#64748b` | `#94a3b8` | Subtítulos e descrições |
| `--primary` | `#2563eb` | `#3b82f6` | Destaques, botões e acentos |
| `--terminal-bg` | `#090d16` | `#030712` | Fundo estilizado do terminal CLI |
| `--terminal-text`| `#38bdf8` | `#38bdf8` | Fonte mono de comandos e saídas |

---

## 4. 🧩 Estrutura de Componentes da SPA

```text
apps/portfolio/src/
├── components/
│   ├── Navbar.jsx               # Cabeçalho fixo com logo, status live pulsante, âncoras e ThemeToggle
│   ├── Navbar.test.jsx
│   ├── Hero.jsx                 # Apresentação de impacto, badge de disponibilidade, botões e métricas
│   ├── Hero.test.jsx
│   ├── TerminalSnippet.jsx      # Terminal DevOps interativo com abas (Terraform, Docker, CI/CD)
│   ├── TerminalSnippet.test.jsx
│   ├── ArchitectureShowcase.jsx # Painel interativo da topologia OCI em produção com inspetor
│   ├── ArchitectureShowcase.test.jsx
│   ├── SkillsMatrix.jsx         # Matriz de competências filtrável por categoria
│   ├── SkillsMatrix.test.jsx
│   ├── FeaturedProjects.jsx     # Cards de projetos (IaC OCI, Fullstack CRUD, CI/CD, Prometheus)
│   ├── FeaturedProjects.test.jsx
│   ├── ExperienceTimeline.jsx   # Pilares de engenharia (IaC, GitOps, Defesa em Camadas, TDD)
│   ├── ContactSection.jsx       # Canais de conexão com botão de cópia de e-mail com 1 clique
│   ├── ContactSection.test.jsx
│   ├── ThemeToggle.jsx          # Botão interativo Sol / Lua com animação
│   ├── ThemeToggle.test.jsx
│   └── Footer.jsx               # Rodapé com metadados e certificação de infraestrutura ativa
├── context/
│   ├── ThemeContext.jsx         # Provider e hook customizado useTheme()
│   └── ThemeContext.test.jsx
├── data/
│   └── portfolioData.js         # Dados desacoplados (métricas, comandos, skills, projetos, contatos)
├── App.jsx                      # Composição geral da aplicação
├── App.test.jsx                 # Teste de integração ponta a ponta da SPA
├── index.css                    # Design tokens e folhas de estilo responsivas
├── main.jsx                     # Montagem no DOM React
└── setupTests.js                # Polyfills de localStorage e matchMedia para Vitest/JSDOM
```

---

## 5. 🚀 Seções em Destaque

### 5.1. Terminal DevOps Interativo (`TerminalSnippet`)
Apresenta uma janela de terminal estilizada com controles macOS, badge de usuário SSH (`guilherme@cloud-primary:~`) e alternância entre 3 fluxos essenciais:
1. **Terraform IaC**: Execução de `terraform apply` demonstrando o provisionamento de 4 nós Always-Free, redes VCN e integração DuckDNS.
2. **Docker Compose**: Execução de `docker compose up -d --build` demonstrando a subida dos 6 containers unificados (`postgres_db`, `fastapi_app`, `react_frontend`, `portfolio_landing`, `prometheus_service`, `nginx_proxy`).
3. **GitHub Actions**: Execução de `gh workflow run` demonstrando a passagem com 100% de testes no pipeline de CI/CD.

### 5.2. Showcase de Arquitetura Cloud em Produção (`ArchitectureShowcase`)
Diagrama interativo navegável onde o visitante clica nos nós da infraestrutura:
- **DuckDNS Resolver** (DNS & Edge)
- **Nginx SSL Proxy** (Reverse Proxy & Gateway na porta 80/443 com HSTS)
- **Landing Page SPA** (Frontend em `:3001`)
- **CRUD Frontend SPA** (Frontend em `:3000` com Auth Wall e OAuth2)
- **FastAPI Backend** (REST API em `:8000` com Pydantic v2 e SQLAlchemy 2.0)
- **PostgreSQL 16** (Database relacional com CHECK constraints nativas)
- **Prometheus Metrics** (Telemetria a cada 10s via OpenMetrics)

Ao clicar em qualquer nó, um inspetor dinâmico detalha as especificações técnicas, parâmetros de rede e links de verificação em tempo real ([/health](file:///home/guilermiii/github/antigravity/health) e [/docs](file:///home/guilermiii/github/antigravity/docs)).

### 5.3. Integração com a Aplicação CRUD
No card de projetos em destaque, a aplicação fullstack de cadastro e autenticação ganha o selo **"Aplicação Principal ao Vivo"** com um botão direto apontando para `/crud`, permitindo a recrutadores e avaliadores navegarem da landing page diretamente para a experiência autenticada com Google/GitHub.

---

## 6. 🧪 Cobertura de Testes Automatizados (TDD)

Todos os testes foram concebidos e escritos **antes** da implementação do código (*Test-Driven Development*). A suíte executa com 100% de sucesso:

```bash
cd apps/portfolio
npm test -- --run
```

### Resultados dos Testes:
- **10 Arquivos de Teste**
- **19 Cenários de Teste Aprovados (100%)**
- **Tempo de Execução:** ~1.7 segundos

| Arquivo de Teste | Quantidade | O que valida |
|---|---|---|
| `ThemeContext.test.jsx` | 3 | Estado padrão claro, alternância para escuro, persistência no `localStorage` e carregamento de preferência salva. |
| `ThemeToggle.test.jsx` | 1 | Acessibilidade do botão (`aria-label`) e alternância entre estados de ícone Sol e Lua. |
| `Navbar.test.jsx` | 2 | Renderização de links de navegação, status da infraestrutura e abertura/fechamento do menu mobile. |
| `Hero.test.jsx` | 2 | Presença da proposta de valor, botões de ação e métricas rápidas (4 VMs, 100% TDD, TLS 1.3, 0 Downtime). |
| `TerminalSnippet.test.jsx` | 2 | Inicialização com aba Terraform e alternância dinâmica entre comandos Docker e GitHub Actions. |
| `ArchitectureShowcase.test.jsx` | 2 | Renderização de todos os 7 nós da topologia e atualização das especificações no painel de detalhes. |
| `SkillsMatrix.test.jsx` | 2 | Exibição das tecnologias fundamentais e filtragem dinâmica por categoria técnica. |
| `FeaturedProjects.test.jsx` | 1 | Renderização dos cards de projetos, badges e link funcional para `/crud`. |
| `ContactSection.test.jsx` | 2 | Exibição dos canais de contato e cópia funcional do e-mail com feedback visual instantâneo. |
| `App.test.jsx` | 2 | Integração de todas as seções e alternância global de tema com alteração de atributo no DOM. |

---

## 7. 💻 Como Executar Localmente

### Pelo Root do Monorepo:
```bash
# Executa apenas a Landing Page de Portfólio (porta 3001)
npm run dev:portfolio

# Executa todos os testes da Landing Page
npm run test:portfolio

# Gera o build de produção da Landing Page
npm run build:portfolio
```

### Diretamente no diretório:
```bash
cd apps/portfolio
npm install
npm run dev
# Acesse no navegador: http://localhost:3001
```
