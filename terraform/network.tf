# ==============================================================================
# Rede Virtual na Nuvem (VCN) e Recursos de Conectividade
# ==============================================================================

# 1. Virtual Cloud Network (VCN)
resource "oci_core_vcn" "main" {
  compartment_id = var.compartment_ocid
  cidr_blocks    = [var.vcn_cidr]
  display_name   = "${var.project_name}-vcn-${var.environment}"
  dns_label      = "antigravity"
}

# 2. Internet Gateway (Conexão bidirecional com a Internet)
resource "oci_core_internet_gateway" "igw" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.project_name}-igw-${var.environment}"
  enabled        = true
}

# 3. Tabela de Rotas Padrão (Direcionando todo tráfego externo ao Internet Gateway)
resource "oci_core_default_route_table" "default_route_table" {
  manage_default_resource_id = oci_core_vcn.main.default_route_table_id
  display_name               = "${var.project_name}-default-rt-${var.environment}"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.igw.id
    description       = "Rota padrao para a Internet via Internet Gateway"
  }
}

# 4. Security List com regras de menor privilégio
resource "oci_core_security_list" "web_security_list" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.project_name}-sl-${var.environment}"

  # Saída (Egress): Permitir todo o tráfego de saída
  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
    stateless   = false
    description = "Permitir todo trafego de saida para a Internet"
  }

  # Entrada (Ingress): SSH (Porta 22)
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    stateless   = false
    description = "Acesso administrativo via SSH (Chave RSA)"

    tcp_options {
      min = 22
      max = 22
    }
  }

  # Entrada (Ingress): HTTP (Porta 80)
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    stateless   = false
    description = "Trafego HTTP e desafio ACME HTTP-01 do Certbot"

    tcp_options {
      min = 80
      max = 80
    }
  }

  # Entrada (Ingress): HTTPS (Porta 443)
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    stateless   = false
    description = "Trafego seguro HTTPS / SSL"

    tcp_options {
      min = 443
      max = 443
    }
  }

  # Entrada (Ingress): ICMP Type 3, Code 4 (Path MTU Discovery) - Boas Práticas OCI
  ingress_security_rules {
    protocol    = "1" # ICMP
    source      = "0.0.0.0/0"
    stateless   = false
    description = "Path MTU Discovery para evitar fragmentacao de pacotes TCP"

    icmp_options {
      type = 3
      code = 4
    }
  }

  # Entrada (Ingress): ICMP Type 8 (Echo / Ping)
  ingress_security_rules {
    protocol    = "1" # ICMP
    source      = "0.0.0.0/0"
    stateless   = false
    description = "Ping / Echo Request para diagnostico de rede"

    icmp_options {
      type = 8
    }
  }

  # Entrada (Ingress): Comunicacao interna irrestrita entre todas as instancias da VCN
  ingress_security_rules {
    protocol    = "all"
    source      = var.vcn_cidr
    stateless   = false
    description = "Permitir comunicacao interna irrestrita entre as 4 instancias da VCN"
  }
}

# 5. Subnet Pública (Onde a instância Compute residirá)
resource "oci_core_subnet" "public_subnet" {
  compartment_id    = var.compartment_ocid
  vcn_id            = oci_core_vcn.main.id
  cidr_block        = var.subnet_cidr
  display_name      = "${var.project_name}-public-subnet-${var.environment}"
  dns_label         = "public"
  security_list_ids = [oci_core_security_list.web_security_list.id]
  route_table_id    = oci_core_default_route_table.default_route_table.id
}
