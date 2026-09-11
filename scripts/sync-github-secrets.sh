#!/bin/bash
# ==============================================================================
# Script de Sincronização Automatizada de Segredos para o GitHub Secrets
# Repositório: guilermiii/antigravity
# ==============================================================================

set -e

ENV_FILE=".env"
DUCKDNS_FILE="terraform/duckdns.txt"

echo "=================================================="
echo "🔐 SINCRONIZADOR DE SEGREDOS -> GITHUB SECRETS"
echo "=================================================="

# 1. Verifica se GitHub CLI (gh) está instalado
if ! command -v gh &> /dev/null; then
    echo "❌ Erro: GitHub CLI ('gh') não foi encontrado no sistema."
    echo "Instale via: sudo apt install gh"
    exit 1
fi

# 2. Verifica autenticação no GitHub CLI
if ! gh auth status &> /dev/null; then
    echo "⚠️  Você não está autenticado no GitHub CLI."
    echo "Para autenticar, execute no terminal:"
    echo "    gh auth login"
    echo "ou defina a variável de ambiente GH_TOKEN:"
    echo "    export GH_TOKEN=seu_personal_access_token_aqui"
    exit 1
fi

echo "✔ GitHub CLI autenticado com sucesso."

# 3. Verifica existência do arquivo .env
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Erro: Arquivo $ENV_FILE não encontrado."
    exit 1
fi

echo "✔ Lendo variáveis de: $ENV_FILE"

TOTAL=0

# 4. Lê variáveis do .env e envia para o GitHub Secrets
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Ignora linhas vazias e comentários
    key=$(echo "$key" | xargs)
    if [[ -z "$key" || "$key" =~ ^# ]]; then
        continue
    fi
    
    # Remove aspas ao redor do valor se existirem
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    printf "  ⏳ Enviando secret: %-30s ... " "$key"
    echo -n "$value" | gh secret set "$key"
    echo "✔ OK"
    TOTAL=$((TOTAL + 1))
done < "$ENV_FILE"

# 5. Adiciona segredos do DuckDNS se o arquivo existir
if [ -f "$DUCKDNS_FILE" ]; then
    DOMAIN=$(grep -i "duckdns_domain" "$DUCKDNS_FILE" 2>/dev/null | head -n 1 | awk '{print $NF}' || true)
    TOKEN=$(grep -E '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' "$DUCKDNS_FILE" 2>/dev/null | head -n 1 | awk '{print $NF}' || true)
    
    if [ -n "$DOMAIN" ]; then
        printf "  ⏳ Enviando secret: %-30s ... " "DUCKDNS_DOMAIN"
        echo -n "$DOMAIN" | gh secret set "DUCKDNS_DOMAIN"
        echo "✔ OK"
        TOTAL=$((TOTAL + 1))
    fi
    if [ -n "$TOKEN" ]; then
        printf "  ⏳ Enviando secret: %-30s ... " "DUCKDNS_TOKEN"
        echo -n "$TOKEN" | gh secret set "DUCKDNS_TOKEN"
        echo "✔ OK"
        TOTAL=$((TOTAL + 1))
    fi
fi

echo "=================================================="
echo "🎉 Concluído! $TOTAL segredos sincronizados com sucesso no GitHub Secrets!"
echo "Acesse: https://github.com/guilermiii/antigravity/settings/secrets/actions"
echo "=================================================="
