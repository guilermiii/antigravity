"""Script de teste de integração automatizado para validar a API FastAPI e o Banco PostgreSQL."""

import json
import os
import time
import urllib.error
import urllib.request

BASE_URL = os.getenv("API_URL", os.getenv("BASE_URL", "http://127.0.0.1:8000"))

_test_client = None
_use_test_client = None


def _init_client():
    global _test_client, _use_test_client
    if _use_test_client is not None:
        return
    if os.getenv("USE_TESTCLIENT", "").lower() in ("1", "true"):
        _use_test_client = True
    else:
        try:
            req = urllib.request.Request(f"{BASE_URL}/", method="GET")
            with urllib.request.urlopen(req, timeout=1.5):
                _use_test_client = False
        except Exception:
            _use_test_client = True

    if _use_test_client:
        try:
            from fastapi.testclient import TestClient
            from app.main import app

            _test_client = TestClient(app)
            print("[test_app] Servidor HTTP não detectado ou USE_TESTCLIENT ativo. Utilizando FastAPI TestClient.")
        except Exception as exc:
            print(f"[test_app] Aviso: Falha ao inicializar TestClient: {exc}. Usando fallback HTTP.")
            _use_test_client = False


_auth_token = None


def set_auth_token(token: str):
    global _auth_token
    _auth_token = token


def get_or_create_test_auth_token():
    try:
        from app.database import SessionLocal
        from app.models import User
        from app.auth.security import create_access_token

        db = SessionLocal()
        try:
            admin_user = db.query(User).filter(User.email == "test_api_runner@example.com").first()
            if not admin_user:
                admin_user = User(
                    nome="API",
                    sobrenome="Tester",
                    email="test_api_runner@example.com",
                    is_active=True,
                )
                db.add(admin_user)
                db.commit()
                db.refresh(admin_user)
            return create_access_token({"sub": str(admin_user.id)})
        finally:
            db.close()
    except Exception as exc:
        print(f"[test_app] Aviso ao obter token via DB: {exc}")
        return None


def make_request(method: str, path: str, data: dict = None, custom_headers: dict = None):
    _init_client()
    req_headers = {}
    if data:
        req_headers["Content-Type"] = "application/json"
    if _auth_token:
        req_headers["Authorization"] = f"Bearer {_auth_token}"
    if custom_headers:
        req_headers.update(custom_headers)

    if _use_test_client and _test_client is not None:
        resp = _test_client.request(method, path, json=data, headers=req_headers)
        try:
            return resp.status_code, resp.json()
        except Exception:
            return resp.status_code, resp.text

    url = f"{BASE_URL}{path}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            try:
                return resp.status, json.loads(content) if content else None
            except Exception:
                return resp.status, content
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            return e.code, json.loads(content)
        except Exception:
            return e.code, content


def run_tests():
    print("Iniciando testes de integração da API (FastAPI + PostgreSQL)...")
    timestamp = int(time.time())

    # 1. Health/Root
    status, res = make_request("GET", "/")
    assert status == 200, f"Falha no GET /: {status}"
    print("✔ GET / OK")

    # 1.1 Health Probe
    status, health = make_request("GET", "/health")
    assert status == 200 and health.get("status") == "healthy", f"Falha no GET /health: {status}, {health}"
    assert health.get("database") == "connected"
    print("✔ GET /health (PostgreSQL probe conectado) OK")

    # 1.2 Validação de Bloqueio sem Autenticação (Regra de Negócio: Não cadastrar nem visualizar sem login)
    status_unauth_post, _ = make_request(
        "POST",
        "/users/",
        {"nome": "Tentativa", "sobrenome": "Anonima", "email": f"anon_{timestamp}@example.com"},
        custom_headers={"Authorization": ""},
    )
    assert status_unauth_post == 401, f"Falha de segurança: POST /users/ sem token retornou {status_unauth_post} (esperado 401)"
    print("✔ Bloqueio de POST /users/ sem autenticação OK (401 Unauthorized)")

    status_unauth_get, _ = make_request(
        "GET",
        "/users/",
        custom_headers={"Authorization": ""},
    )
    assert status_unauth_get == 401, f"Falha de segurança: GET /users/ sem token retornou {status_unauth_get} (esperado 401)"
    print("✔ Bloqueio de GET /users/ sem autenticação OK (401 Unauthorized)")

    # 1.3 Obtenção de Token de Autenticação para testes de CRUD
    token = get_or_create_test_auth_token()
    if token:
        set_auth_token(token)
        print("✔ Autenticação JWT inicializada para operações do sistema")

    # 2. Criar Usuário com apenas campos obrigatórios (nome, sobrenome, email)
    mandatory_payload = {
        "nome": "Carlos",
        "sobrenome": "Eduardo",
        "email": f"carlos_{timestamp}@example.com",
    }
    status, user_min = make_request("POST", "/users/", mandatory_payload)
    assert status == 201, f"Falha ao criar usuário com obrigatórios: {status}, {user_min}"
    assert user_min["nome"] == "Carlos"
    assert user_min["sobrenome"] == "Eduardo"
    assert user_min["pais"] == "Brasil"
    assert user_min["cpf"] is None
    min_user_id = user_min["id"]
    print(f"✔ POST /users/ (apenas obrigatórios) OK (ID: {min_user_id})")

    # 3. Criar Usuário com todos os campos completos
    full_payload = {
        "nome": "Fernanda",
        "sobrenome": "Montenegro",
        "email": f"fernanda_{timestamp}@example.com",
        "telefone": "(11) 98765-4321",
        "idade": 45,
        "genero": "Feminino",
        "cpf": "52998224725",
        "rua": "Av Paulista",
        "numero": "1578",
        "cidade": "São Paulo",
        "estado": "SP",
        "cep": "01310-200",
        "pais": "Brasil",
        "escolaridade": "Pós-Graduação",
    }
    status, user_full = make_request("POST", "/users/", full_payload)
    assert status == 201, f"Falha ao criar usuário completo: {status}, {user_full}"
    assert user_full["nome"] == "Fernanda"
    assert user_full["sobrenome"] == "Montenegro"
    assert user_full["idade"] == 45
    assert user_full["cpf"] == "52998224725"
    assert user_full["cep"] == "01310-200"
    user_id = user_full["id"]
    print(f"✔ POST /users/ (cadastro completo) OK (ID: {user_id})")

    # 4. Validação: Falha ao omitir nome
    status, err = make_request(
        "POST",
        "/users/",
        {"sobrenome": "Silva", "email": f"noname_{timestamp}@example.com"},
    )
    assert status == 422, f"Deveria retornar 422 para nome ausente: {status}"
    print("✔ Validação de campo 'nome' obrigatório OK (422 Unprocessable Entity)")

    # 5. Validação: Falha ao omitir sobrenome
    status, err = make_request(
        "POST",
        "/users/",
        {"nome": "João", "email": f"nosobrenome_{timestamp}@example.com"},
    )
    assert status == 422, f"Deveria retornar 422 para sobrenome ausente: {status}"
    print("✔ Validação de campo 'sobrenome' obrigatório OK (422 Unprocessable Entity)")

    # 6. Validação de e-mail duplicado
    status, err = make_request(
        "POST",
        "/users/",
        {
            "nome": "Fernanda Clone",
            "sobrenome": "Silva",
            "email": full_payload["email"],
        },
    )
    assert status == 400, f"Deveria retornar 400 para e-mail duplicado: {status}"
    print("✔ Validação de e-mail duplicado OK (400 Bad Request)")

    # 7. Validação de formato de e-mail inválido
    status, err = make_request(
        "POST",
        "/users/",
        {"nome": "Invalido", "sobrenome": "Email", "email": "email_sem_arroba"},
    )
    assert status == 422, f"Deveria retornar 422 para e-mail inválido: {status}"
    print("✔ Validação de formato de e-mail OK (422 Unprocessable Entity)")

    # 8. Validação de CPF inválido
    status, err = make_request(
        "POST",
        "/users/",
        {
            "nome": "Invalido",
            "sobrenome": "CPF",
            "email": f"invcpf_{timestamp}@example.com",
            "cpf": "11111111111",
        },
    )
    assert status == 422, f"Deveria retornar 422 para CPF inválido: {status}"
    print("✔ Validação de algoritmo de CPF OK (422 Unprocessable Entity)")

    # 9. Validação de idade fora dos limites
    status, err = make_request(
        "POST",
        "/users/",
        {
            "nome": "Invalido",
            "sobrenome": "Idade",
            "email": f"invidade_{timestamp}@example.com",
            "idade": 200,
        },
    )
    assert status == 422, f"Deveria retornar 422 para idade > 150: {status}"
    print("✔ Validação de limites de idade OK (422 Unprocessable Entity)")

    # 10. Teste de segurança Anti-SQL Injection
    sqli_text = "Robert'); DROP TABLE users; --"
    sqli_payload = {
        "nome": "Teste",
        "sobrenome": sqli_text,
        "email": f"sqli_{timestamp}@example.com",
        "rua": "' OR '1'='1",
    }
    status, sqli_user = make_request("POST", "/users/", sqli_payload)
    assert status == 201, f"Falha ao manipular string com caracteres SQL: {status}, {sqli_user}"
    assert sqli_user["sobrenome"] == sqli_text
    print(f"✔ Proteção Anti-SQL Injection OK (caracteres persistidos com segurança)")

    # 11. Buscar por ID
    status, user_found = make_request("GET", f"/users/{user_id}")
    assert status == 200 and user_found["id"] == user_id
    assert user_found["nome"] == "Fernanda"
    assert user_found["sobrenome"] == "Montenegro"
    assert user_found["cidade"] == "São Paulo"
    print(f"✔ GET /users/{user_id} OK")

    # 12. Atualizar Usuário
    status, updated = make_request(
        "PUT",
        f"/users/{user_id}",
        {
            "sobrenome": "Montenegro Atualizada",
            "telefone": "(11) 99999-8888",
            "cidade": "Campinas",
        },
    )
    assert status == 200
    assert updated["sobrenome"] == "Montenegro Atualizada"
    assert updated["telefone"] == "(11) 99999-8888"
    assert updated["cidade"] == "Campinas"
    assert updated["nome"] == "Fernanda"  # Mantém o campo não alterado
    print(f"✔ PUT /users/{user_id} OK")

    # 13. Listar Usuários
    status, users = make_request("GET", "/users/")
    assert status == 200 and isinstance(users, list)
    print(f"✔ GET /users/ OK (Total retornado: {len(users)})")

    # 14. Deletar Usuários de Teste
    for uid in [user_id, min_user_id, sqli_user["id"]]:
        status, _ = make_request("DELETE", f"/users/{uid}")
        assert status == 204
    print("✔ DELETE /users/{id} OK para registros criados")

    # 15. Confirmar que não existe mais
    status, _ = make_request("GET", f"/users/{user_id}")
    assert status == 404
    print("✔ Verificação pós-deleção OK (404 Not Found)")

    # 16. Prometheus Metrics Scrape Endpoint
    status, metrics_text = make_request("GET", "/metrics")
    assert status == 200, f"Falha no GET /metrics: {status}"
    assert isinstance(metrics_text, str), "Resposta de /metrics deve ser texto puro"
    assert "http_requests_total" in metrics_text
    assert "http_request_duration_seconds" in metrics_text
    assert "app_users_total" in metrics_text
    assert "app_user_operations_total" in metrics_text
    print("✔ GET /metrics (Prometheus OpenMetrics exposition format) OK")

    print("\n🎉 Todos os testes de integração da API foram executados com sucesso!")


if __name__ == "__main__":
    run_tests()
