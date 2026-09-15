# ==============================================================================
# Backend Remoto Nativo OCI via HTTP (Pre-Authenticated Request)
# ==============================================================================
# Na Oracle Cloud Infrastructure (OCI), o state e o state locking são gerenciados
# nativamente através de chamadas HTTP (backend "http") utilizando Pre-Authenticated Request (PAR)
# gerada diretamente no bucket de storage da OCI.
#
# Como ativar o State Locking remoto nativo na OCI:
# 1. No OCI Console, acesse: Storage -> Buckets -> Create Bucket (ex: "terraform-states").
# 2. Crie ou faça upload de um objeto inicial (ex: "terraform.tfstate").
# 3. No objeto criado, clique em "Create Pre-Authenticated Request" (PAR):
#    - Pre-Authenticated Request Target: "Object"
#    - Access Type: "Permit reads and writes" (necessário para ler e atualizar o estado)
#    - Expiration: Defina a data de expiração desejada
# 4. Copie a URL completa da PAR gerada:
#    Exemplo: https://objectstorage.<region>.oraclecloud.com/p/<par_token>/n/<namespace>/b/<bucket>/o/terraform.tfstate
# 5. Descomente o bloco "terraform" abaixo, insira a URL completa em "address" e execute:
#      terraform init -migrate-state
# ==============================================================================

# terraform {
#   backend "http" {
#     address       = "https://objectstorage.<region>.oraclecloud.com/p/<par_token>/n/<namespace>/b/<bucket>/o/terraform.tfstate"
#     update_method = "PUT"
#   }
# }
