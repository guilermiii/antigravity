# ==============================================================================
# Instâncias Compute OCI Always Free (Cluster de 4 Nós: 2 ARM + 2 AMD)
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Instâncias ARM Ampere A1 (VM.Standard.A1.Flex)
# Always Free permite 1.500 OCPU-horas e 9.000 GB-horas/mês (~2 OCPUs e 12 GB RAM)
# Divididas em 2 instâncias de 1 OCPU e 6 GB RAM cada (47 GB de boot volume cada)
# ------------------------------------------------------------------------------
resource "oci_core_instance" "arm_instances" {
  count               = var.arm_instance_count
  compartment_id      = var.compartment_ocid
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[var.availability_domain_number - 1].name
  fault_domain        = var.fault_domain
  display_name        = "${var.project_name}-arm-${count.index + 1}-${var.environment}"
  shape               = "VM.Standard.A1.Flex"

  # Configuração flexível de CPU e Memória (1 OCPU / 6 GB RAM por nó no Always Free)
  shape_config {
    ocpus         = var.arm_ocpus_per_instance
    memory_in_gbs = var.arm_memory_in_gbs_per_instance
  }

  # Disco de boot mínimo de 47 GB (Canonical Ubuntu 24.04 ARM)
  source_details {
    source_type             = "image"
    source_id               = var.image_ocid != null ? var.image_ocid : data.oci_core_images.ubuntu_arm.images[0].id
    boot_volume_size_in_gbs = var.boot_volume_size_in_gbs
  }

  # Configuração da interface de rede (VNIC)
  create_vnic_details {
    subnet_id        = oci_core_subnet.public_subnet.id
    display_name     = "${var.project_name}-arm-${count.index + 1}-vnic-${var.environment}"
    assign_public_ip = count.index == 0 ? false : true # O nó primário (index 0) recebe o IP Fixo Reservado via public_ip.tf
    hostname_label   = "${var.project_name}-arm-${count.index + 1}"
  }

  # Injeção de chave SSH e Cloud-Init (DuckDNS ativado apenas no nó 0 para não sobrescrever IP)
  metadata = {
    ssh_authorized_keys = var.ssh_public_key != null ? var.ssh_public_key : file(pathexpand(var.ssh_public_key_path))
    user_data = base64encode(templatefile("${path.module}/scripts/cloud-init.yaml", {
      duckdns_domain = count.index == 0 ? var.duckdns_domain : "",
      duckdns_token  = count.index == 0 ? var.duckdns_token : ""
    }))
  }

  preserve_boot_volume = false

  lifecycle {
    ignore_changes = [
      source_details[0].source_id
    ]
  }
}

# ------------------------------------------------------------------------------
# 2. Instâncias AMD Micro (VM.Standard.E2.1.Micro)
# Always Free permite até 2 microinstâncias com processador AMD (1/8 OCPU, 1 GB RAM)
# Cada uma com 47 GB de boot volume (Canonical Ubuntu 24.04 x86_64)
# ------------------------------------------------------------------------------
resource "oci_core_instance" "amd_instances" {
  count               = var.amd_instance_count
  compartment_id      = var.compartment_ocid
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[var.availability_domain_number - 1].name
  fault_domain        = var.fault_domain
  display_name        = "${var.project_name}-amd-${count.index + 1}-${var.environment}"
  shape               = "VM.Standard.E2.1.Micro"

  # Disco de boot mínimo de 47 GB (Canonical Ubuntu 24.04 x86_64)
  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.ubuntu_amd.images[0].id
    boot_volume_size_in_gbs = var.boot_volume_size_in_gbs
  }

  # Configuração da interface de rede (VNIC com IP público efêmero gratuito)
  create_vnic_details {
    subnet_id        = oci_core_subnet.public_subnet.id
    display_name     = "${var.project_name}-amd-${count.index + 1}-vnic-${var.environment}"
    assign_public_ip = true
    hostname_label   = "${var.project_name}-amd-${count.index + 1}"
  }

  # Injeção de chave SSH e Cloud-Init (Docker Engine instalado sem DuckDNS)
  metadata = {
    ssh_authorized_keys = var.ssh_public_key != null ? var.ssh_public_key : file(pathexpand(var.ssh_public_key_path))
    user_data = base64encode(templatefile("${path.module}/scripts/cloud-init.yaml", {
      duckdns_domain = "",
      duckdns_token  = ""
    }))
  }

  preserve_boot_volume = false

  lifecycle {
    ignore_changes = [
      source_details[0].source_id
    ]
  }
}
