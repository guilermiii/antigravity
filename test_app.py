"""Script de teste automatizado para validar o CRUD e a API."""

import json
import urllib.error
import urllib.request

BASE_URL = "http://localhost:8000"


def make_request(method: str, path: str, data: dict = None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"} if data else {}
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else None
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            return e.code, json.loads(content)
        except Exception:
            return e.code, content


def run_tests():
    print("Iniciando testes da API...")

    # 1. Health/Root
    status, res = make_request("GET", "/")
    assert status == 200, f"Falha no GET /: {status}"
    print("✔ GET / OK")

    # 2. Criar Usuário
    status, user = make_request(
        "POST",
        "/users/",
        {"name": "Carlos Eduardo", "email": "carlos@example.com"},
    )
    assert status == 201, f"Falha ao criar usuário: {status}, {user}"
    user_id = user["id"]
    print(f"✔ POST /users/ OK (ID: {user_id})")

    # 3. Validação de e-mail duplicado
    status, err = make_request(
        "POST",
        "/users/",
        {"name": "Carlos 2", "email": "carlos@example.com"},
    )
    assert status == 400, f"Deveria retornar 400 para e-mail duplicado: {status}"
    print("✔ Validação de e-mail duplicado OK (400 Bad Request)")

    # 4. Validação de formato de e-mail
    status, err = make_request(
        "POST",
        "/users/",
        {"name": "Invalido", "email": "email_invalido"},
    )
    assert status == 422, f"Deveria retornar 422 para e-mail inválido: {status}"
    print("✔ Validação de formato de e-mail OK (422 Unprocessable Entity)")

    # 5. Buscar por ID
    status, user_found = make_request("GET", f"/users/{user_id}")
    assert status == 200 and user_found["id"] == user_id
    print(f"✔ GET /users/{user_id} OK")

    # 6. Atualizar Usuário
    status, updated = make_request(
        "PUT",
        f"/users/{user_id}",
        {"name": "Carlos Eduardo Silva"},
    )
    assert status == 200 and updated["name"] == "Carlos Eduardo Silva"
    print(f"✔ PUT /users/{user_id} OK")

    # 7. Listar Usuários
    status, users = make_request("GET", "/users/")
    assert status == 200 and isinstance(users, list)
    print(f"✔ GET /users/ OK (Total retornado: {len(users)})")

    # 8. Deletar Usuário
    status, _ = make_request("DELETE", f"/users/{user_id}")
    assert status == 204
    print(f"✔ DELETE /users/{user_id} OK")

    # 9. Confirmar que não existe mais
    status, _ = make_request("GET", f"/users/{user_id}")
    assert status == 404
    print(f"✔ Verificação pós-deleção OK (404 Not Found)")

    print("\n🎉 Todos os testes foram executados com sucesso!")


if __name__ == "__main__":
    run_tests()
