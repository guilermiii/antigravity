# ☁️ Infraestrutura OCI Always Free (ARM Ampere A1.Flex) com Terraform

Este diretório contém os manifestos modulares do **Terraform** para provisionamento automatizado de infraestrutura na **Oracle Cloud Infrastructure (OCI)** dentro do plano **Always Free**, utilizando arquitetura **ARM (Ampere A1.Flex)**, com provisionamento automatizado via **Cloud-Init (Ubuntu)**, **IP Público Reservado (Fixo)** retornado via bloco `data`, integração com **DuckDNS** e suporte a **State Locking nativo na OCI via chamadas HTTP (Pre-Authenticated Request - PAR)**.

---

## 🏛️ Diagrama de Arquitetura da Solução

```mermaid
flowchart TD
    subgraph Client ["Cliente / Navegador / Internet"]
        User(["Usuário / Navegador"])
        DuckDNS["DuckDNS DNS Resolver\n(guilermiii.duckdns.org)"]
        LetsEncrypt["Let's Encrypt ACME CA"]
    end

    subgraph OCI ["Oracle Cloud Infrastructure (Always Free - ARM)"]
        subgraph VCN ["VCN: 10.0.0.0/16"]
            IGW["Internet Gateway"]
            SL["Security List / NSG\n(Ingress: 22, 80, 443, ICMP | Egress: All)"]
            Subnet["Public Subnet: 10.0.1.0/24"]
            
            subgraph VM ["Instância Compute: VM.Standard.A1.Flex (Ubuntu 24.04 ARM)"]
                ReservedIP["IP Público Reservado (Fixo)\n(Capturado via Bloco Data)"]
                HostFirewall["Firewall do SO (iptables/ufw)\n(Portas 22, 80, 443 Abertas)"]

                subgraph DockerEngine ["Docker Engine & Docker Compose"]
                    NginxProxy["nginx_proxy (:80, :443)\nProxy Reverso & SSL Termination"]
                    Certbot["certbot_service\n(ACME HTTP-01 Challenge)"]
                    FastAPI["fastapi_app (:8000 interno)"]
                    ReactApp["react_frontend (:3000 interno)"]
                    Postgres["postgres_db (:5432 interno)"]
                    Prometheus["prometheus_service (:9090 interno)"]
                end
            end
        end

        subgraph OCIStorage ["OCI Storage / Remote State"]
            TFBucket[("Bucket OCI: terraform-states\nPAR HTTP Read/Write")]
        end
    end

    User -->|1. Consulta DNS| DuckDNS
    DuckDNS -->|Retorna IP Reservado| User
    User -->|2. Requisição HTTPS (443) / HTTP (80)| ReservedIP
    ReservedIP --> IGW
    IGW --> SL
    SL --> HostFirewall
    HostFirewall --> NginxProxy

    NginxProxy -->|location /| ReactApp
    NginxProxy -->|location /users, /auth, /health, /docs| FastAPI
    NginxProxy -->|location /.well-known/acme-challenge/| Certbot
    LetsEncrypt -->|Validação ACME HTTP-01| NginxProxy
    FastAPI --> Postgres
    Prometheus -->|Scrape /metrics| FastAPI

    TerraformCLI["Terraform CLI"] -.->|backend 'http' (PUT/GET)| TFBucket
```

---

## 📂 Estrutura Modular dos Manifestos

```text
terraform/
├── backend.tf                # Configuração do backend remoto nativo OCI via HTTP com PAR
├── providers.tf              # Provedor oracle/oci e versão mínima do Terraform
├── variables.tf              # Declaração tipada de variáveis, validações e defaults
├── terraform.tfvars.example  # Modelo para preenchimento das credenciais de API
├── datasources.tf            # Lookups dinâmicos (Ubuntu ARM, ADs) e Bloco Data do IP Fixo
├── network.tf                # VCN, Internet Gateway, Default Route Table, Security List e Subnet
├── compute.tf                # Instância ARM A1.Flex, injeção de chave SSH RSA e user_data
├── public_ip.tf              # Recurso de IP Público Reservado vinculado à VNIC
├── outputs.tf                # IP Fixo obtido via bloco data, comandos SSH e URLs DuckDNS
├── scripts/
│   └── cloud-init.yaml       # Script cloud-init para instalação do Docker, firewall e DuckDNS
└── README.md                 # Este guia de referência
```

---

## 🚀 Pré-requisitos

1. **Conta na Oracle Cloud Infrastructure (OCI)** com plano Always Free ativo.
2. **Chave de API da OCI configurada**:
   - No Console OCI, clique no seu perfil de usuário (canto superior direito) -> **User Settings**.
   - Role até **API Keys** -> clique em **Add API Key**.
   - Baixe a chave privada (`.pem`) e salve em `~/.oci/oci_api_key.pem`.
   - Copie o **User OCID**, **Tenancy OCID**, **Fingerprint** e **Region**.
3. **Chave SSH RSA Existente**:
   - Reutilize sua chave pública RSA existente em `~/.ssh/id_rsa.pub` (usada no GitHub).
4. **Conta no DuckDNS**:
   - Acesse [DuckDNS](https://www.duckdns.org/domains) e registre o subdomínio `guilermiii` (gera `guilermiii.duckdns.org`).
   - Copie o seu token de autenticação.

---

## 🔒 State Locking Nativo na OCI via HTTP (Pre-Authenticated Request)

Na OCI, a persistência e o bloqueio de estado remoto não utilizam S3 nem DynamoDB da AWS, mas sim chamadas HTTP nativas (`backend "http"`) contra o serviço de Storage da OCI via **Pre-Authenticated Request (PAR)** com suporte a operações atômicas `GET` e `PUT`:

### Como ativar o State Remoto com PAR:
1. No Console OCI, acesse: **Storage -> Buckets -> Create Bucket**.
   - Nome do Bucket: `terraform-states` (ou o de sua preferência).
2. Dentro do bucket, faça o upload de um arquivo vazio inicial com o nome `terraform.tfstate`.
3. Clique no menu de três pontos do arquivo `terraform.tfstate` -> **Create Pre-Authenticated Request**:
   - **Pre-Authenticated Request Target**: `Object`
   - **Access Type**: `Permit reads and writes` (obrigatório para leitura e atualização)
   - **Expiration**: Defina a data de expiração desejada.
4. Clique em **Create Pre-Authenticated Request** e copie a **URL completa** exibida.
5. Abra o arquivo `terraform/backend.tf`, descomente o bloco e cole a URL no campo `address`:
   ```hcl
   terraform {
     backend "http" {
       address       = "https://objectstorage.sa-saopaulo-1.oraclecloud.com/p/SEU_TOKEN_PAR/n/SEU_NAMESPACE/b/terraform-states/o/terraform.tfstate"
       update_method = "PUT"
     }
   }
   ```
6. Inicialize e migre o estado local para o bucket da OCI:
   ```bash
   terraform init -migrate-state
   ```

---

## 🛠️ Passo a Passo de Execução

### 1. Configurar as Variáveis
Copie o modelo de exemplo para criar seu arquivo de variáveis local:
```bash
cp terraform.tfvars.example terraform.tfvars
```
Edite `terraform.tfvars` preenchendo suas credenciais:
```hcl
tenancy_ocid        = "ocid1.tenancy.oc1..aaaa..."
user_ocid           = "ocid1.user.oc1..aaaa..."
fingerprint         = "xx:xx:xx:xx:xx:xx..."
private_key_path    = "~/.oci/oci_api_key.pem"
region              = "sa-saopaulo-1"
compartment_ocid    = "ocid1.compartment.oc1..aaaa..."

# Chave SSH RSA existente
ssh_public_key_path = "~/.ssh/id_rsa.pub"

# DuckDNS
duckdns_domain      = "guilermiii"
duckdns_token       = "seu_token_duckdns"
```

### 2. Inicializar e Validar o Terraform
```bash
terraform init
terraform fmt -check
terraform validate
```

### 3. Planejar o Provisionamento
```bash
terraform plan
```

### 4. Aplicar o Provisionamento
```bash
terraform apply
```

Ao finalizar, o Terraform exibirá os outputs, incluindo o **IP público fixo capturado exclusivamente através do bloco data**:
```text
Outputs:
duckdns_url            = "https://guilermiii.duckdns.org"
duckdns_www_url        = "https://www.guilermiii.duckdns.org"
instance_id            = "ocid1.instance.oc1.sa-saopaulo-1..."
public_ip              = "129.148.xx.xx"
ssh_connection_command = "ssh -i ~/.ssh/id_rsa ubuntu@129.148.xx.xx"
swagger_docs_url       = "https://guilermiii.duckdns.org/docs"
```

---

## ⚡ Automação de Cloud-Init e Firewall do Ubuntu OCI

### O Desafio do Firewall Nativo da Oracle
As imagens oficiais do Canonical Ubuntu na OCI contêm regras restritivas no `/etc/iptables/rules.v4` que **rejeitam conexões nas portas 80 e 443 por padrão**, mesmo com a Security List da VCN configurada corretamente.

### Solução Implementada no `scripts/cloud-init.yaml`:
O script automatizado:
1. Insere regras `ACCEPT` para as portas `80/tcp` e `443/tcp` no `iptables` da máquina antes da regra de descarte (`REJECT`).
2. Persiste as regras com o pacote `netfilter-persistent` para que sobrevivam a reboots da máquina.
3. Instala o **Docker Engine** e **Docker Compose plugin** oficiais para arquitetura `arm64`.
4. Adiciona o usuário `ubuntu` ao grupo `docker`.
5. Configura um cron job para atualizar o IP público no **DuckDNS** a cada 5 minutos.

---

## 🚢 Deploy da Aplicação na Instância OCI

Após o provisionamento da instância, conecte-se via SSH:
```bash
ssh -i ~/.ssh/id_rsa ubuntu@<IP_PUBLICO>
```

Clone o repositório e execute a emissão dos certificados SSL com Certbot:
```bash
git clone <URL_DO_SEU_REPOSITORIO> /opt/antigravity
cd /opt/antigravity

# Configure o arquivo .env de produção
cp .env.example .env
# Ajuste as URLs para https://guilermiii.duckdns.org

# Execute o script de bootstrap SSL (Let's Encrypt)
./scripts/init-letsencrypt.sh
```

A aplicação estará acessível com TLS/HTTPS válido em:
- **Aplicação Web (React SPA)**: `https://guilermiii.duckdns.org`
- **Documentação Swagger (FastAPI)**: `https://guilermiii.duckdns.org/docs`
- **Health Check**: `https://guilermiii.duckdns.org/health`
