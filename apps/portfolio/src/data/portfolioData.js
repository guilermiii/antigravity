export const personalInfo = {
  name: 'Guilherme',
  handle: 'guilermiii',
  title: 'DevOps & Cloud Platform Engineer',
  tagline: 'Engenharia de Plataforma, Automação Cloud & Infraestrutura Resiliente',
  bio: 'Especialista em construir infraestruturas de alta disponibilidade como código (IaC), esteiras de CI/CD automatizadas com gates de segurança, orquestração de containers e arquiteturas escaláveis com observabilidade em tempo real.',
  status: 'Infra Operacional',
  statusDescription: 'Disponível para novas oportunidades & consultorias',
  email: 'guilermiii2003@gmail.com',
  domain: 'guilermiii.duckdns.org',
  github: 'https://github.com/guilermiii',
  repo: 'https://github.com/guilermiii/antigravity',
};

export const quickMetrics = [
  { label: 'VMs na Nuvem', value: '4 VMs', detail: 'OCI Always-Free Ampere / x86' },
  { label: 'Cobertura TDD', value: '100%', detail: 'Backend, Frontend & E2E' },
  { label: 'Segurança SSL', value: 'TLS 1.3', detail: 'Let\'s Encrypt com HSTS A+' },
  { label: 'Disponibilidade', value: '0 Downtime', detail: 'Deploy Contínuo via GitHub Actions' },
];

export const terminalSnippets = {
  terraform: {
    title: 'Terraform IaC',
    command: 'terraform apply -auto-approve -var-file="production.tfvars"',
    output: `[oci_core_vcn.main]: Creating Virtual Cloud Network (10.0.0.0/16)...
[oci_core_subnet.public]: Subnet 10.0.1.0/24 ready.
[oci_core_instance.primary]: Provisioning VM.Standard.A1.Flex (4 OCPU, 24GB RAM)...
[oci_core_instance.workers]: Provisioning 3x Always-Free Compute Nodes...
[duckdns_updater]: Pointing guilermiii.duckdns.org -> 129.148.x.x

Apply complete! Resources: 4 added, 0 changed, 0 destroyed.
Outputs:
primary_ip     = "129.148.x.x"
domain_url     = "https://guilermiii.duckdns.org"
infra_status   = "OPERATIONAL (100% HEALTHY)"`,
  },
  docker: {
    title: 'Docker Compose',
    command: 'docker compose up -d --build',
    output: `[+] Building 6/6
 ✔ Container postgres_db       Running (Healthy) [Port 5432]
 ✔ Container fastapi_app       Running (Healthy) [Port 8000]
 ✔ Container react_frontend    Running           [Port 3000]
 ✔ Container portfolio_landing Running           [Port 3001]
 ✔ Container prometheus_srv    Running           [Port 9090]
 ✔ Container nginx_proxy       Running (TLS 1.3) [Port 80, 443]

Status: Running 6/6 containers unified behind reverse proxy.`,
  },
  cicd: {
    title: 'GitHub Actions',
    command: 'gh workflow run ci-main.yml && gh workflow run cd-production.yml',
    output: `✓ Workflow 'CI - Main Production Pipeline' triggered (#42)
  ├── Job 'Production Backend & Security Suite': 63/63 tests passed (100%)
  ├── Job 'Frontend Vitest & Build': 85/85 tests passed (100%)
  └── Job 'Portfolio Vitest & Build': 10/10 tests passed (100%)
✓ Workflow 'CD - Production Deployment to OCI' completed
  ├── Syncing project files via rsync to /opt/antigravity
  ├── Zero-downtime container recreate & healthcheck probe
  └── All 3 workflows completed successfully. Release v2.3.0 deployed.`,
  },
};

export const architectureNodes = [
  {
    id: 'duckdns',
    name: 'DuckDNS Resolver',
    layer: 'DNS & Edge',
    icon: 'Globe',
    badge: 'Dynamic DNS',
    description: 'Resolução dinâmica de domínio apontando guilermiii.duckdns.org diretamente para o IP público estático da VM primária na OCI.',
    specs: 'TTL: 60s | Cron Sync: 5min | SSL Validation Ready',
  },
  {
    id: 'nginx',
    name: 'Nginx SSL Proxy',
    layer: 'Reverse Proxy & Gateway',
    icon: 'Shield',
    badge: 'Porta 80 / 443 com HSTS',
    description: 'Reverse Proxy & SSL Termination com certificados automáticos Let\'s Encrypt (Certbot), suporte a HTTP/2, HSTS e compressão gzip.',
    specs: 'TLS 1.3 / 1.2 | Ciphers Modernos | Rate Limiting | WebSocket HMR',
  },
  {
    id: 'portfolio',
    name: 'Landing Page SPA',
    layer: 'Frontend App (:3001)',
    icon: 'Layout',
    badge: 'React 18 + Vite',
    description: 'SPA moderna com portfólio DevOps, alternância de Modo Escuro/Claro, telemetria de projetos e 100% de testes automatizados com Vitest.',
    specs: 'Single Page App | Design Tokens CSS | Lucide Icons | Zero-Flicker Themes',
  },
  {
    id: 'crud',
    name: 'CRUD Frontend SPA',
    layer: 'Frontend App (:3000)',
    icon: 'Users',
    badge: 'Auth Wall & OAuth2',
    description: 'Interface completa de gerenciamento de usuários com autenticação obrigatória via GitHub e Google, filtros em tempo real e máscaras.',
    specs: '85 Testes Vitest | Auth Guard | Modais Acessíveis | Context API',
  },
  {
    id: 'fastapi',
    name: 'FastAPI Backend',
    layer: 'REST API (:8000)',
    icon: 'Server',
    badge: 'Python 3.11',
    description: 'API REST assíncrona de alta performance com OpenAPI 3.1, migrações versionadas com Alembic, blindagem anti-SQLi/XSS/CSRF e JWT HS256.',
    specs: '63 Testes Unitários | Pydantic v2 | SQLAlchemy 2.0 | Swagger UI',
  },
  {
    id: 'postgres',
    name: 'PostgreSQL 16',
    layer: 'Database (:5432)',
    icon: 'Database',
    badge: 'CHECK Constraints',
    description: 'Banco de dados relacional com integridade estrita garantida nativamente na engine por constraints e volume Docker persistente.',
    specs: 'Postgres 16 Alpine | Prepared Statements | CHECK Regex | Volume Dedicado',
  },
  {
    id: 'prometheus',
    name: 'Prometheus Metrics',
    layer: 'Observability (:9090)',
    icon: 'Activity',
    badge: 'Telemetria',
    description: 'Coleta de métricas contínuas a cada 10 segundos com endpoints /metrics e /health, monitorando latência, taxa de erros e throughput.',
    specs: 'OpenMetrics | Scrape Interval 10s | Latency Histograms | HTTP Middleware',
  },
];

export const skillsCategories = [
  {
    id: 'all',
    label: 'Todas as Competências',
  },
  {
    id: 'iac',
    label: 'Cloud & IaC',
  },
  {
    id: 'cicd',
    label: 'CI/CD & Automação',
  },
  {
    id: 'sec',
    label: 'Segurança & Redes',
  },
  {
    id: 'sre',
    label: 'Observabilidade & SRE',
  },
  {
    id: 'dev',
    label: 'Backend & Testes',
  },
];

export const skillsList = [
  { name: 'Terraform', category: 'iac', level: 'Avançado', highlight: 'Módulos OCI & AWS, automação de VCN e Compute' },
  { name: 'Docker', category: 'iac', level: 'Avançado', highlight: 'Multi-stage builds, isolamento e otimização de imagens' },
  { name: 'Docker Compose', category: 'iac', level: 'Avançado', highlight: 'Orquestração multi-container local e produção' },
  { name: 'Oracle Cloud (OCI)', category: 'iac', level: 'Intermediário', highlight: 'Arquitetura Always-Free, Security Lists e VCNs' },
  { name: 'Linux & Bash', category: 'iac', level: 'Avançado', highlight: 'Shell scripting, automação, systemd, hardening' },
  
  { name: 'GitHub Actions', category: 'cicd', level: 'Avançado', highlight: 'Pipelines multi-estágio, auto-merge, secrets sync e gates' },
  { name: 'Bash & Shell Script', category: 'cicd', level: 'Avançado', highlight: 'Scripts resilientes de deploy, backup e certbot' },
  { name: 'Git & GitOps', category: 'cicd', level: 'Avançado', highlight: 'Fluxos trunk-based, branch protection e automações' },
  
  { name: 'Nginx', category: 'sec', level: 'Avançado', highlight: 'Reverse proxy, SSL termination, rate limit e headers HSTS' },
  { name: 'SSL/TLS & Certbot', category: 'sec', level: 'Avançado', highlight: 'Renovação automática Let\'s Encrypt com verificação ACME' },
  { name: 'OAuth 2.0 & JWT', category: 'sec', level: 'Avançado', highlight: 'Fluxo seguro com Google e GitHub, blindagem CSRF e tokens' },
  { name: 'Hardening & Security', category: 'sec', level: 'Avançado', highlight: 'Mitigação de SQLi, XSS, State Tampering e scans de secrets' },
  
  { name: 'Prometheus', category: 'sre', level: 'Intermediário', highlight: 'Telemetria de APIs, histogramas de latência e scraping' },
  { name: 'Health Probes', category: 'sre', level: 'Avançado', highlight: 'Liveness e readiness probes em containers e Nginx' },
  { name: 'OpenMetrics', category: 'sre', level: 'Intermediário', highlight: 'Exposição padronizada de métricas de aplicação' },
  
  { name: 'Python & FastAPI', category: 'dev', level: 'Avançado', highlight: 'APIs REST assíncronas, OpenAPI e injeção de dependências' },
  { name: 'SQLAlchemy & Alembic', category: 'dev', level: 'Avançado', highlight: 'ORM 2.0 com migrações versionadas no PostgreSQL' },
  { name: 'React 18 & Vite', category: 'dev', level: 'Intermediário', highlight: 'SPAs rápidas com Context API, Design Tokens e Vite' },
  { name: 'TDD & Vitest', category: 'dev', level: 'Avançado', highlight: 'Testes unitários e de integração antes do código' },
];

export const featuredProjects = [
  {
    id: 'oci-iac',
    title: 'Infraestrutura OCI com Terraform',
    subtitle: 'Cluster Always-Free Automatizado',
    description: 'Provisionamento automatizado como código (IaC) de 4 instâncias de computação na Oracle Cloud Infrastructure, rede virtual (VCN), subnets públicas/privadas, regras estritas de firewall (Security Lists) e DNS dinâmico integrado com DuckDNS.',
    tags: ['Terraform', 'OCI', 'IaC', 'DuckDNS', 'Linux'],
    links: [
      { label: 'Ver Código Terraform', url: 'https://github.com/guilermiii/antigravity/tree/main/terraform' },
      { label: 'Health Check Ao Vivo', url: '/health' },
    ],
  },
  {
    id: 'fullstack-crud',
    title: 'Sistema Fullstack OAuth2 CRUD',
    subtitle: 'Aplicação Completa em Produção com TDD',
    description: 'Aplicação empresarial containerizada com autenticação federada Google e GitHub, Auth Wall, validação em duas camadas (Pydantic v2 e CHECK Constraints nativas no PostgreSQL 16) e 148 testes automatizados (63 backend + 85 frontend).',
    tags: ['FastAPI', 'React 18', 'PostgreSQL 16', 'OAuth 2.0', 'TDD', 'Docker'],
    isPrimaryApp: true,
    links: [
      { label: 'Acessar Aplicação CRUD', url: '/crud', isPrimary: true },
      { label: 'Documentação Swagger', url: '/docs' },
    ],
  },
  {
    id: 'cicd-pipeline',
    title: 'Pipeline CI/CD Zero-Downtime',
    subtitle: 'Esteiras Automatizadas no GitHub Actions',
    description: 'Pipeline contínuo de 3 estágios (ci-development, ci-main, cd-production) com execução automática de testes unitários e de segurança, gate de aprovação, merge automático e deploy em produção via rsync e SSH com sincronização de segredos.',
    tags: ['GitHub Actions', 'CI/CD', 'Rsync', 'SSH', 'Secrets Management'],
    links: [
      { label: 'Ver Workflows CI/CD', url: 'https://github.com/guilermiii/antigravity/tree/main/.github/workflows' },
    ],
  },
  {
    id: 'observability',
    title: 'Suite de Observabilidade Prometheus',
    subtitle: 'Monitoramento Contínuo de Métricas & Saúde',
    description: 'Servidor Prometheus dedicado coletando métricas a cada 10 segundos da API FastAPI, monitorando vazão de requisições por método/rota, percentis de latência, contadores de CRUD e eventos de autenticação federada.',
    tags: ['Prometheus', 'OpenMetrics', 'Telemetria', 'Docker'],
    links: [
      { label: 'Métricas Live (/metrics)', url: '/metrics' },
    ],
  },
];
