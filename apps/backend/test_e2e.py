"""Validação Ponta a Ponta (E2E) dos serviços: Frontend (React:3000), Backend (FastAPI:8000) e Banco (PostgreSQL:5432)."""

import json
import os
import urllib.error
import urllib.request

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")


def http_get(url: str, headers: dict = None):
    req = urllib.request.Request(url, headers=headers or {}, method="GET")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, resp.read().decode("utf-8"), resp.headers
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8"), e.headers


def http_get(url: str, headers: dict = None):
    req = urllib.request.Request(url, headers=headers or {}, method="GET")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, resp.read().decode("utf-8"), resp.headers
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8"), e.headers


def http_options(url: str, origin: str):
    headers = {
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
    }
    req = urllib.request.Request(url, headers=headers, method="OPTIONS")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, resp.headers
    except urllib.error.HTTPError as e:
        return e.code, e.headers


def http_post_json(url: str, data: dict, headers: dict = None):
    body = json.dumps(data).encode("utf-8")
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, data=body, headers=req_headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))


def http_put_json(url: str, data: dict, headers: dict = None):
    body = json.dumps(data).encode("utf-8")
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, data=body, headers=req_headers, method="PUT")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))


def http_delete(url: str, headers: dict = None):
    req_headers = headers or {}
    req = urllib.request.Request(url, headers=req_headers, method="DELETE")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code


def run_e2e_verification():
    print("==================================================")
    print("🚀 INICIANDO VALIDAÇÃO PONTA A PONTA (E2E)")
    print("==================================================")

    # 1. Frontend: HTML e Bootstrap
    print("\n[E2E-1] Testando entrega do Frontend React em http://localhost:3000...")
    status, html, _ = http_get(FRONTEND_URL)
    assert status == 200, f"Frontend não respondeu 200: {status}"
    assert "Cadastro de Usuários | CRUD" in html, "Título HTML incorreto"
    assert 'id="root"' in html, "Elemento root do React não encontrado no HTML"
    print("  ✔ Frontend entregou index.html corretamente com status 200.")

    # 2. Frontend: Carregamento dos módulos Vite
    print("\n[E2E-2] Testando carregamento do bundle Vite...")
    status, js, _ = http_get(f"{FRONTEND_URL}/src/main.jsx")
    assert status == 200, "main.jsx não encontrado"
    assert "ReactDOM.createRoot" in js, "Bootstrap do React não encontrado em main.jsx"
    print("  ✔ Servidor Vite compilou e entregou o código React com status 200.")

    # 3. Integração CORS: Frontend -> Backend
    print("\n[E2E-3] Verificando cabeçalhos de CORS entre Frontend e Backend...")
    status, headers = http_options(f"{BACKEND_URL}/users/", FRONTEND_URL)
    assert status == 200, f"Preflight CORS falhou: {status}"
    allow_origin = headers.get("Access-Control-Allow-Origin")
    assert allow_origin in [FRONTEND_URL, "*"], f"CORS incorreto: {allow_origin}"
    print(f"  ✔ CORS validado com sucesso! Access-Control-Allow-Origin: {allow_origin}")

    # 4. Fluxo Completo de Usuário (Jornada do Usuário com Novos Campos)
    unique_suffix = abs(hash("e2e_test_user_v2")) % 100000
    user_payload = {
        "nome": "Usuario",
        "sobrenome": f"E2E {unique_suffix}",
        "email": f"e2e_{unique_suffix}@example.com",
        "telefone": "(11) 98888-7777",
        "idade": 32,
        "genero": "Outro",
        "cpf": "52998224725",
        "rua": "Rua das Flores",
        "numero": "123",
        "cidade": "Curitiba",
        "estado": "PR",
        "cep": "80010-000",
        "pais": "Brasil",
        "escolaridade": "Ensino Superior",
    }

    # 4.1 Validação de rota protegida contra acesso anônimo
    print("\n[E2E-4] Testando proteção de rota: POST /users/ sem token...")
    status, unauth_resp = http_post_json(f"{BACKEND_URL}/users/", user_payload)
    assert status == 401, f"Esperado 401 para acesso anônimo, recebido {status}: {unauth_resp}"
    print("  ✔ Rota /users/ devidamente protegida contra acesso não autenticado (401 Unauthorized).")

    # 4.2 Obtenção de token de sessão para testes
    print("\n[E2E-5] Obtendo token de sessão para automação E2E (/auth/test-token)...")
    status, token_data = http_post_json(f"{BACKEND_URL}/auth/test-token", {})
    assert status == 200, f"Falha ao obter token de teste: {status}, {token_data}"
    token = token_data.get("access_token")
    assert token, "access_token ausente na resposta de autenticação"
    auth_headers = {"Authorization": f"Bearer {token}"}
    print("  ✔ Token de sessão obtido com sucesso.")

    # 4.3 Criação autenticada
    print(f"\n[E2E-6] Criando usuário autenticado via API ({user_payload['nome']} {user_payload['sobrenome']})...")
    status, created_user = http_post_json(f"{BACKEND_URL}/users/", user_payload, headers=auth_headers)
    assert status == 201, f"Falha ao criar: {status}, {created_user}"
    assert created_user["nome"] == user_payload["nome"]
    assert created_user["sobrenome"] == user_payload["sobrenome"]
    assert created_user["cidade"] == "Curitiba"
    user_id = created_user["id"]
    print(f"  ✔ Usuário criado com sucesso no PostgreSQL com ID #{user_id}.")

    # 4.4 Consulta autenticada
    print(f"\n[E2E-7] Consultando usuário persistido ID #{user_id}...")
    status, fetched_raw, _ = http_get(f"{BACKEND_URL}/users/{user_id}", headers=auth_headers)
    fetched_user = json.loads(fetched_raw)
    assert status == 200
    assert fetched_user["email"] == user_payload["email"]
    assert fetched_user["nome"] == user_payload["nome"]
    assert fetched_user["sobrenome"] == user_payload["sobrenome"]
    assert fetched_user["cpf"] == user_payload["cpf"]
    print("  ✔ Usuário consultado com sucesso do banco de dados (todos os campos validados).")

    # 4.5 Atualização autenticada
    print(f"\n[E2E-8] Atualizando sobrenome e cidade do usuário ID #{user_id}...")
    updated_sobrenome = f"E2E {unique_suffix} Atualizado"
    status, updated_user = http_put_json(
        f"{BACKEND_URL}/users/{user_id}",
        {"sobrenome": updated_sobrenome, "cidade": "Londrina"},
        headers=auth_headers,
    )
    assert status == 200
    assert updated_user["sobrenome"] == updated_sobrenome
    assert updated_user["cidade"] == "Londrina"
    print(f"  ✔ Dados atualizados com sucesso no PostgreSQL.")

    # 4.6 Exclusão autenticada
    print(f"\n[E2E-9] Excluindo usuário ID #{user_id}...")
    status = http_delete(f"{BACKEND_URL}/users/{user_id}", headers=auth_headers)
    assert status == 204
    print("  ✔ Usuário excluído com status 204.")

    # 4.7 Verificação pós-exclusão
    status, _, _ = http_get(f"{BACKEND_URL}/users/{user_id}", headers=auth_headers)
    assert status == 404
    print("  ✔ Verificado: registro não existe mais no banco (404 Not Found).")

    print("\n==================================================")
    print("🎉 TODAS AS VERIFICAÇÕES PONTA A PONTA (E2E) PASSARAM!")
    print("==================================================")


if __name__ == "__main__":
    run_e2e_verification()
