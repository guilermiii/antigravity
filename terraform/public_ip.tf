# ==============================================================================
# IP Público Reservado (Fixo)
# ==============================================================================
# Provisiona um endereço IPv4 público estático (lifetime = "RESERVED")
# e vincula à interface de rede (VNIC) primária da instância compute.
# ==============================================================================

resource "oci_core_public_ip" "web_reserved_public_ip" {
  compartment_id = var.compartment_ocid
  display_name   = "${var.project_name}-reserved-ip-${var.environment}"
  lifetime       = "RESERVED"
  private_ip_id  = data.oci_core_private_ips.primary_private_ip.private_ips[0].id

  lifecycle {
    ignore_changes = [private_ip_id]
  }
}
