#!/bin/bash
# ==============================================================================
# Script de Auditoria e Sincronização Automatizada de Segredos no GitHub Actions
# Repositório: guilermiii/antigravity
# ==============================================================================

set -e

ENV_FILE=".env"
DUCKDNS_FILE="terraform/duckdns.txt"
SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/id_rsa}"
SSH_HOST="${SSH_HOST:-137.131.206.187}"
SSH_USER="${SSH_USER:-ubuntu}"
SSH_PORT="${SSH_PORT:-22}"

MODE="sync"
if [[ "$1" == "--audit" || "$1" == "--dry-run" ]]; then
    MODE="audit"
fi

echo "================================================================="
echo "🔐 AUDITORIA & SINCRONIZADOR DE SEGREDOS -> GITHUB ACTIONS"
echo "================================================================="
echo "Modo de execução: $MODE"
echo ""

# 1. Verifica existência do arquivo .env
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Erro: Arquivo $ENV_FILE não encontrado no diretório atual."
    exit 1
fi

# 2. Carrega credenciais do DuckDNS
DUCKDNS_DOMAIN="guilermiii"
DUCKDNS_TOKEN=""
if [ -f "$DUCKDNS_FILE" ]; then
    DUCKDNS_TOKEN=$(grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' "$DUCKDNS_FILE" | head -n 1 || true)
fi

# 3. Carrega chave privada SSH
SSH_PRIVATE_KEY=""
if [ -f "$SSH_KEY_PATH" ]; then
    SSH_PRIVATE_KEY=$(cat "$SSH_KEY_PATH")
fi

# Dicionário/Mapa de segredos essenciais
declare -A SECRETS_MAP

# Segredos de Deploy SSH (OCI Primary Node)
SECRETS_MAP["SSH_HOST"]="$SSH_HOST"
SECRETS_MAP["SSH_USER"]="$SSH_USER"
SECRETS_MAP["SSH_PORT"]="$SSH_PORT"
SECRETS_MAP["SSH_PRIVATE_KEY"]="$SSH_PRIVATE_KEY"

# Segredos DuckDNS
SECRETS_MAP["DUCKDNS_DOMAIN"]="$DUCKDNS_DOMAIN"
SECRETS_MAP["DUCKDNS_TOKEN"]="$DUCKDNS_TOKEN"

# Segredos da Aplicação (.env)
while IFS='=' read -r key value || [ -n "$key" ]; do
    key=$(echo "$key" | xargs)
    if [[ -z "$key" || "$key" =~ ^# ]]; then
        continue
    fi
    # Remove aspas ao redor do valor
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    SECRETS_MAP["$key"]="$value"
done < "$ENV_FILE"

# Auditoria
TOTAL_KEYS=${#SECRETS_MAP[@]}
CONFIGURED_COUNT=0
MISSING_COUNT=0

echo "📋 Resumo dos Segredos Auditados ($TOTAL_KEYS variáveis mapeadas):"
printf "  %-30s | %-12s | %-20s\n" "NOME DO SECRET" "STATUS" "DETALHE"
echo "  -------------------------------+--------------+---------------------"

for key in $(echo "${!SECRETS_MAP[@]}" | tr ' ' '\n' | sort); do
    val="${SECRETS_MAP[$key]}"
    if [ -n "$val" ]; then
        CONFIGURED_COUNT=$((CONFIGURED_COUNT + 1))
        # Mascara o valor para exibição segura
        len=${#val}
        if [ "$len" -gt 8 ]; then
            masked="${val:0:3}...${val: -3} ($len chars)"
        else
            masked="*** ($len chars)"
        fi
        printf "  %-30s | \033[0;32m%-12s\033[0m | %-20s\n" "$key" "CONFIGURADO" "$masked"
    else
        MISSING_COUNT=$((MISSING_COUNT + 1))
        printf "  %-30s | \033[0;31m%-12s\033[0m | %-20s\n" "$key" "AUSENTE" "Não encontrado"
    fi
done

echo ""
echo "📊 Estatísticas da Auditoria: $CONFIGURED_COUNT configurados | $MISSING_COUNT ausentes de $TOTAL_KEYS segredos totais."

if [ "$MODE" == "audit" ]; then
    echo "ℹ️  Modo auditoria concluído. Nenhuma alteração realizada no GitHub."
    exit 0
fi

# Validação do GitHub CLI para o envio
echo ""
echo "🔍 Verificando GitHub CLI (gh)..."
if ! command -v gh &> /dev/null; then
    echo "❌ Erro: GitHub CLI ('gh') não foi encontrado no sistema."
    echo "Instale via: sudo apt install gh"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "⚠️  Você não está autenticado no GitHub CLI."
    echo "Para autenticar e enviar todos os $CONFIGURED_COUNT segredos para o GitHub Secrets:"
    echo "  1. Execute no terminal:  gh auth login"
    echo "     (ou exporte o token:   export GH_TOKEN=seu_personal_access_token)"
    echo "  2. Execute novamente:   ./scripts/sync-github-secrets.sh"
    exit 1
fi

echo "✔ GitHub CLI autenticado com sucesso."
echo "🚀 Sincronizando segredos com o GitHub Actions..."
echo ""

SYNCED=0
for key in $(echo "${!SECRETS_MAP[@]}" | tr ' ' '\n' | sort); do
    val="${SECRETS_MAP[$key]}"
    if [ -z "$val" ]; then
        echo "  ⚠️  Pulando secret vazio: $key"
        continue
    fi
    printf "  ⏳ Enviando secret: %-30s ... " "$key"
    echo -n "$val" | gh secret set "$key"
    echo "✔ OK"
    SYNCED=$((SYNCED + 1))
done

echo ""
echo "================================================================="
echo "🎉 SUCESSO! $SYNCED segredos sincronizados no GitHub Actions!"
echo "================================================================="
echo ""
echo "📋 Segredos atualmente registrados no repositório:"
gh secret list
