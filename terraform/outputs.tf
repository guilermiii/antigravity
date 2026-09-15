# ==============================================================================
# Outputs: Informações e Endereços Retornados pelo Terraform
# ==============================================================================

# 1. IP público fixo (reservado) retornado através do bloco data
# Requisito explícito: "preciso que me retorne o ip publico fixo que for atribuido atraves do bloco data"
output "public_ip" {
  description = "IP público fixo (reservado) atribuído à instância primária, consultado via bloco data"
  value       = data.oci_core_public_ip.instance_reserved_ip.ip_address
}

# 2. Comando pronto para conexão SSH à instância primária
output "ssh_connection_command" {
  description = "Comando pronto para conexão SSH à instância primária utilizando a chave RSA existente"
  value       = "ssh -i ~/.ssh/id_rsa ubuntu@${data.oci_core_public_ip.instance_reserved_ip.ip_address}"
}

# 3. URLs de acesso à aplicação configuradas para o subdomínio DuckDNS
output "duckdns_url" {
  description = "URL principal da aplicação via DuckDNS (HTTPS)"
  value       = "https://${var.duckdns_domain}.duckdns.org"
}

output "duckdns_www_url" {
  description = "URL com prefixo www da aplicação via DuckDNS (HTTPS)"
  value       = "https://www.${var.duckdns_domain}.duckdns.org"
}

output "swagger_docs_url" {
  description = "URL direta da documentação interativa Swagger da API FastAPI"
  value       = "https://${var.duckdns_domain}.duckdns.org/docs"
}

# 4. Total de armazenamento de boot alocado no Always Free (limite 200 GB)
output "total_boot_storage_gb" {
  description = "Total de armazenamento alocado para discos de boot no Always Free (Limite OCI: 200 GB)"
  value       = "${(var.arm_instance_count + var.amd_instance_count) * var.boot_volume_size_in_gbs} GB / 200 GB"
}

# 5. Inventário completo das 4 instâncias do cluster
output "all_instances_inventory" {
  description = "Inventário detalhado de todas as instâncias provisionadas no cluster Always Free"
  value = concat(
    [
      for idx, inst in oci_core_instance.arm_instances : {
        name         = inst.display_name
        shape        = inst.shape
        architecture = "arm64"
        ocpus        = var.arm_ocpus_per_instance
        memory_gb    = var.arm_memory_in_gbs_per_instance
        disk_gb      = var.boot_volume_size_in_gbs
        role         = idx == 0 ? "Primary (Nginx / DuckDNS / Apps)" : "Worker ARM"
        private_ip   = inst.private_ip
        public_ip    = idx == 0 ? data.oci_core_public_ip.instance_reserved_ip.ip_address : inst.public_ip
        ssh_command  = "ssh -i ~/.ssh/id_rsa ubuntu@${idx == 0 ? data.oci_core_public_ip.instance_reserved_ip.ip_address : inst.public_ip}"
      }
    ],
    [
      for idx, inst in oci_core_instance.amd_instances : {
        name         = inst.display_name
        shape        = inst.shape
        architecture = "x86_64"
        ocpus        = 0.125
        memory_gb    = 1
        disk_gb      = var.boot_volume_size_in_gbs
        role         = "Worker AMD Micro"
        private_ip   = inst.private_ip
        public_ip    = inst.public_ip
        ssh_command  = "ssh -i ~/.ssh/id_rsa ubuntu@${inst.public_ip}"
      }
    ]
  )
}
