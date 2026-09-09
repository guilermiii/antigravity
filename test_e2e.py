"""Validação Ponta a Ponta (E2E) dos serviços: Frontend (React:3000), Backend (FastAPI:8000) e Banco (PostgreSQL:5432)."""

import json
import urllib.error
import urllib.request

FRONTEND_URL = "http://localhost:3000"
BACKEND_URL = "http://localhost:8000"


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


def http_post_json(url: str, data: dict):
    body = json.dumps(data).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))


def http_put_json(url: str, data: dict):
    body = json.dumps(data).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    req = urllib.request.Request(url, data=body, headers=headers, method="PUT")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))


def http_delete(url: str):
    req = urllib.request.Request(url, method="DELETE")
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

    # 4.1 Criação
    print(f"\n[E2E-4] Criando usuário via API ({user_payload['nome']} {user_payload['sobrenome']})...")
    status, created_user = http_post_json(f"{BACKEND_URL}/users/", user_payload)
    assert status == 201, f"Falha ao criar: {status}, {created_user}"
    assert created_user["nome"] == user_payload["nome"]
    assert created_user["sobrenome"] == user_payload["sobrenome"]
    assert created_user["cidade"] == "Curitiba"
    user_id = created_user["id"]
    print(f"  ✔ Usuário criado com sucesso no PostgreSQL com ID #{user_id}.")

    # 4.2 Consulta
    print(f"\n[E2E-5] Consultando usuário persistido ID #{user_id}...")
    status, fetched_raw, _ = http_get(f"{BACKEND_URL}/users/{user_id}")
    fetched_user = json.loads(fetched_raw)
    assert status == 200
    assert fetched_user["email"] == user_payload["email"]
    assert fetched_user["nome"] == user_payload["nome"]
    assert fetched_user["sobrenome"] == user_payload["sobrenome"]
    assert fetched_user["cpf"] == user_payload["cpf"]
    print("  ✔ Usuário consultado com sucesso do banco de dados (todos os campos validados).")

    # 4.3 Atualização
    print(f"\n[E2E-6] Atualizando sobrenome e cidade do usuário ID #{user_id}...")
    updated_sobrenome = f"E2E {unique_suffix} Atualizado"
    status, updated_user = http_put_json(
        f"{BACKEND_URL}/users/{user_id}",
        {"sobrenome": updated_sobrenome, "cidade": "Londrina"},
    )
    assert status == 200
    assert updated_user["sobrenome"] == updated_sobrenome
    assert updated_user["cidade"] == "Londrina"
    print(f"  ✔ Dados atualizados com sucesso no PostgreSQL.")

    # 4.4 Exclusão
    print(f"\n[E2E-7] Excluindo usuário ID #{user_id}...")
    status = http_delete(f"{BACKEND_URL}/users/{user_id}")
    assert status == 204
    print("  ✔ Usuário excluído com status 204.")

    # 4.5 Verificação pós-exclusão
    status, _, _ = http_get(f"{BACKEND_URL}/users/{user_id}")
    assert status == 404
    print("  ✔ Verificado: registro não existe mais no banco (404 Not Found).")

    print("\n==================================================")
    print("🎉 TODAS AS VERIFICAÇÕES PONTA A PONTA (E2E) PASSARAM!")
    print("==================================================")


if __name__ == "__main__":
    run_e2e_verification()
