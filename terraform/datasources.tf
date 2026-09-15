# ==============================================================================
# Data Sources: Consulta de Recursos Existentes e Dinâmicos na OCI
# ==============================================================================

# 1. Consulta dinâmica de Availability Domains da Tenancy
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

# 2. Consulta da imagem oficial Canonical Ubuntu mais recente para ARM (A1.Flex)
data "oci_core_images" "ubuntu_arm" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = var.ubuntu_version
  shape                    = "VM.Standard.A1.Flex"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

# 3. Consulta da imagem oficial Canonical Ubuntu mais recente para AMD Micro (E2.1.Micro)
data "oci_core_images" "ubuntu_amd" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = var.ubuntu_version
  shape                    = "VM.Standard.E2.1.Micro"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

# 4. Consulta de anexos de VNIC da instância ARM primária
data "oci_core_vnic_attachments" "primary_arm_vnics" {
  compartment_id = var.compartment_ocid
  instance_id    = oci_core_instance.arm_instances[0].id
}

# 5. Consulta da VNIC primária da instância Compute ARM primária
data "oci_core_vnic" "primary_arm_vnic" {
  vnic_id = data.oci_core_vnic_attachments.primary_arm_vnics.vnic_attachments[0].vnic_id
}

# 6. Consulta do IP Privado primário associado à VNIC da instância ARM primária
data "oci_core_private_ips" "primary_private_ip" {
  vnic_id = data.oci_core_vnic.primary_arm_vnic.id
}

# ==============================================================================
# 6. BLOCO DATA: Retorno do IP Público Fixo Atribuído
# Requisito explícito: "preciso que me retorne o ip publico fixo que for
# atribuido atraves do bloco data"
# ==============================================================================
data "oci_core_public_ip" "instance_reserved_ip" {
  ip_address = oci_core_public_ip.web_reserved_public_ip.ip_address
}
