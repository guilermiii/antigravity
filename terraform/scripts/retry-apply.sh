#!/bin/bash
# ==============================================================================
# Script de Retry para Provisionamento ARM A1.Flex na OCI (Always Free)
# ==============================================================================

set -e
cd "$(dirname "$0")/.."

echo "=================================================================="
echo "🔄 SCRIPT DE RETRY: Provisionamento ARM A1.Flex na OCI (Always Free)"
echo "=================================================================="
echo "Devido à altíssima demanda por instâncias ARM Ampere no datacenter"
echo "de São Paulo (sa-saopaulo-1), a Oracle frequentemente reporta"
echo "'Out of host capacity' até que um slot físico seja liberado no pool."
echo "Este script tenta aplicar a cada 30 segundos até obter o slot!"
echo "Pressione Ctrl+C para interromper."
echo "=================================================================="

ATTEMPT=1
while true; do
  echo ""
  echo "------------------------------------------------------------------"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Tentativa de provisionamento #$ATTEMPT..."
  echo "------------------------------------------------------------------"
  
  if terraform apply -auto-approve; then
    echo ""
    echo "=================================================================="
    echo "🎉 SUCESSO! Instância ARM e IP Público Reservado provisionados!"
    echo "=================================================================="
    exit 0
  fi
  
  echo "Capacidade ARM temporariamente esgotada na OCI. Aguardando 30s..."
  ATTEMPT=$((ATTEMPT + 1))
  sleep 30
done
