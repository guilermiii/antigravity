# ==============================================================================
# Variáveis de Autenticação e Provedor OCI
# ==============================================================================

variable "tenancy_ocid" {
  description = "OCID da Tenancy da Oracle Cloud Infrastructure (OCI)"
  type        = string
}

variable "user_ocid" {
  description = "OCID do usuário OCI com permissão de gerenciamento"
  type        = string
}

variable "fingerprint" {
  description = "Fingerprint da chave privada de API cadastrada no OCI Console"
  type        = string
}

variable "private_key_path" {
  description = "Caminho para a chave privada de API da OCI (ex: ~/.oci/oci_api_key.pem)"
  type        = string
  default     = "~/.oci/oci_api_key.pem"
}

variable "region" {
  description = "Região da OCI para deploy dos recursos (ex: sa-saopaulo-1, us-ashburn-1)"
  type        = string
  default     = "sa-saopaulo-1"
}

variable "compartment_ocid" {
  description = "OCID do Compartment onde os recursos de rede e compute serão criados"
  type        = string
}

# ==============================================================================
# Configurações do Projeto e Ambiente
# ==============================================================================

variable "project_name" {
  description = "Prefixo identificador do projeto para nomenclatura dos recursos"
  type        = string
  default     = "antigravity"
}

variable "environment" {
  description = "Nome do ambiente de execução (ex: production, staging, dev)"
  type        = string
  default     = "production"
}

# ==============================================================================
# Configurações das Instâncias Compute (Always Free - ARM Ampere A1 & AMD Micro)
# ==============================================================================

variable "arm_instance_count" {
  description = "Quantidade de instâncias ARM A1.Flex (Always Free permite até 2 instâncias com 1 OCPU cada)"
  type        = number
  default     = 2

  validation {
    condition     = var.arm_instance_count >= 0 && var.arm_instance_count <= 4
    error_message = "A quantidade de instâncias ARM deve estar entre 0 e 4."
  }
}

variable "arm_ocpus_per_instance" {
  description = "Quantidade de OCPUs por instância ARM (1 OCPU por instância no plano Always Free de 2 nós)"
  type        = number
  default     = 1

  validation {
    condition     = var.arm_ocpus_per_instance >= 1 && var.arm_ocpus_per_instance <= 4
    error_message = "O número de OCPUs por instância ARM deve ser entre 1 e 4."
  }
}

variable "arm_memory_in_gbs_per_instance" {
  description = "Quantidade de memória RAM em GBs por instância ARM (6 GB por instância no plano Always Free de 2 nós)"
  type        = number
  default     = 6

  validation {
    condition     = var.arm_memory_in_gbs_per_instance >= 1 && var.arm_memory_in_gbs_per_instance <= 24
    error_message = "A memória em GBs por instância ARM deve ser entre 1 e 24."
  }
}

variable "amd_instance_count" {
  description = "Quantidade de instâncias AMD VM.Standard.E2.1.Micro (Always Free permite até 2 instâncias)"
  type        = number
  default     = 2

  validation {
    condition     = var.amd_instance_count >= 0 && var.amd_instance_count <= 2
    error_message = "A quantidade de instâncias AMD Micro deve estar entre 0 e 2."
  }
}

variable "boot_volume_size_in_gbs" {
  description = "Tamanho do volume de boot em GBs (Mínimo de 50 GB exigido pela API da OCI; 4 x 50 = 200 GB = 100% Always Free)"
  type        = number
  default     = 50

  validation {
    condition     = var.boot_volume_size_in_gbs >= 50 && var.boot_volume_size_in_gbs <= 200
    error_message = "O tamanho do boot volume deve ser de no mínimo 50 GB e no máximo 200 GB."
  }
}

variable "ubuntu_version" {
  description = "Versão do sistema operacional Canonical Ubuntu"
  type        = string
  default     = "24.04"
}

variable "image_ocid" {
  description = "OCID opcional da imagem de SO (se omitido, busca dinamicamente a imagem Ubuntu ARM mais recente)"
  type        = string
  default     = null
}

variable "availability_domain_number" {
  description = "Número do Availability Domain para provisionamento (1, 2 ou 3)"
  type        = number
  default     = 1
}

variable "fault_domain" {
  description = "Fault Domain opcional (FAULT-DOMAIN-1, FAULT-DOMAIN-2, FAULT-DOMAIN-3)"
  type        = string
  default     = null
}

# ==============================================================================
# Chave SSH Existente (Reutilização da Chave RSA)
# ==============================================================================

variable "ssh_public_key_path" {
  description = "Caminho para a chave pública SSH RSA existente no host local"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "ssh_public_key" {
  description = "Conteúdo direto da chave pública SSH RSA (caso prefira passar o valor em vez do caminho)"
  type        = string
  default     = null
}

# ==============================================================================
# Configurações de DNS e Domínio (DuckDNS)
# ==============================================================================

variable "duckdns_domain" {
  description = "Subdomínio DuckDNS registrado (ex: 'guilermiii' para 'guilermiii.duckdns.org')"
  type        = string
  default     = "guilermiii"
}

variable "duckdns_token" {
  description = "Token de autenticação do DuckDNS para atualização dinâmica de IP"
  type        = string
  default     = ""
  sensitive   = true
}

# ==============================================================================
# Configurações de Rede (VCN & Subnets)
# ==============================================================================

variable "vcn_cidr" {
  description = "Bloco CIDR para a Virtual Cloud Network (VCN)"
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_cidr" {
  description = "Bloco CIDR para a Subnet pública"
  type        = string
  default     = "10.0.1.0/24"
}
