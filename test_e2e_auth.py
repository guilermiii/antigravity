#!/usr/bin/env python3
"""
Validação Ponta a Ponta (E2E) e Teste de Segurança para Autenticação OAuth2 (GitHub & Google)
Executado contra a API FastAPI em execução (http://localhost:8000).
"""

import http.client
import json
import sys
import urllib.parse
import urllib.request

API_BASE_URL = "http://localhost:8000"


def http_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    parsed = urllib.parse.urlparse(url)
    conn = http.client.HTTPConnection(parsed.hostname, parsed.port or 80)
    path = parsed.path
    if parsed.query:
        path += f"?{parsed.query}"

    body = json.dumps(data) if data is not None else None
    if body:
        headers["Content-Type"] = "application/json"

    # Permite capturar redirects 307/302 sem seguir automaticamente
    conn.request(method, path, body=body, headers=headers)
    response = conn.getresponse()
    resp_body = response.read().decode("utf-8")
    resp_headers = dict(response.getheaders())
    conn.close()
    return response.status, resp_body, resp_headers


def run_e2e_auth_verification():
    print("=" * 60)
    print("🔐 INICIANDO VALIDAÇÃO E2E DE AUTENTICAÇÃO OAUTH2 E SEGURANÇA")
    print("=" * 60)

    # 1. Rota de Login do GitHub
    print("\n[E2E-AUTH-1] Testando GET /auth/github/login...")
    status, _, headers = http_request(f"{API_BASE_URL}/auth/github/login")
    assert status in [302, 307], f"Esperado redirect 302/307, recebido {status}"
    location = headers.get("location") or headers.get("Location")
    assert location, "Cabeçalho Location não encontrado no redirecionamento"
    assert "github.com/login/oauth/authorize" in location, "URL de destino do GitHub incorreta"
    assert "state=" in location, "Parâmetro state anti-CSRF ausente"
    assert "client_id=" in location, "Parâmetro client_id ausente"
    print(f"  ✔ Redirecionamento seguro para GitHub validado com sucesso!")

    # 2. Rota de Login do Google
    print("\n[E2E-AUTH-2] Testando GET /auth/google/login...")
    status, _, headers = http_request(f"{API_BASE_URL}/auth/google/login")
    assert status in [302, 307], f"Esperado redirect 302/307, recebido {status}"
    location = headers.get("location") or headers.get("Location")
    assert location, "Cabeçalho Location não encontrado no redirecionamento"
    assert "accounts.google.com/o/oauth2/v2/auth" in location, "URL de destino do Google incorreta"
    assert "state=" in location, "Parâmetro state anti-CSRF ausente"
    assert "response_type=code" in location, "Parâmetro response_type=code ausente"
    print(f"  ✔ Redirecionamento seguro para Google validado com sucesso!")

    # 3. Blindagem contra SQL Injection em endpoints de autenticação
    print("\n[E2E-AUTH-3] Testando blindagem contra SQL Injection em /auth/github/callback...")
    sqli_state = urllib.parse.quote("' OR '1'='1' --")
    status, body, _ = http_request(f"{API_BASE_URL}/auth/github/callback?code=mock&state={sqli_state}")
    assert status == 400, f"Esperado 400 Bad Request contra SQLi, recebido {status}: {body}"
    print(f"  ✔ Payload SQL Injection bloqueado com sucesso (400 Bad Request)!")

    # 4. Blindagem contra CSRF e Forjamento de State
    print("\n[E2E-AUTH-4] Testando proteção Anti-CSRF (State forjado e State ausente)...")
    status, body, _ = http_request(f"{API_BASE_URL}/auth/github/callback?code=mock")
    assert status == 400, f"Esperado 400 para callback sem state, recebido {status}"

    status, body, _ = http_request(f"{API_BASE_URL}/auth/github/callback?code=mock&state=invalid.forged.state")
    assert status == 400, f"Esperado 400 para state forjado, recebido {status}"
    print(f"  ✔ Proteção Anti-CSRF validada com sucesso!")

    # 5. Blindagem de Rota Protegida /auth/me (Ataques JWT e Ausência de Token)
    print("\n[E2E-AUTH-5] Testando endpoint protegido /auth/me sem credenciais...")
    status, body, _ = http_request(f"{API_BASE_URL}/auth/me")
    assert status == 401, f"Esperado 401 Unauthorized, recebido {status}: {body}"

    # Ataque Alg: None em JWT
    print("\n[E2E-AUTH-6] Testando bloqueio contra ataque JWT Alg: None...")
    fake_token = "eyJhbGciOiAibm9uZSIsICJ0eXAiOiAiSldUIn0.eyJzdWIiOiAiMSJ9."
    status, body, _ = http_request(
        f"{API_BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {fake_token}"},
    )
    assert status == 401, f"Esperado 401 Unauthorized contra Alg: None, recebido {status}"
    print(f"  ✔ Ataque Alg: None neutralizado com sucesso (401 Unauthorized)!")

    # 6. Endpoint de Logout
    print("\n[E2E-AUTH-7] Testando POST /auth/logout...")
    status, body, _ = http_request(f"{API_BASE_URL}/auth/logout", method="POST")
    assert status == 200, f"Esperado 200 OK no logout, recebido {status}"
    print(f"  ✔ Logout concluído com sucesso!")

    # 7. Redirecionamento resiliente de erro para o Frontend
    print("\n[E2E-AUTH-8] Testando redirecionamento seguro com erro para o frontend...")
    status, _, headers = http_request(
        f"{API_BASE_URL}/auth/github/callback?error=access_denied&error_description=Consent%20Denied"
    )
    assert status in [302, 307], f"Esperado 302/307, recebido {status}"
    location = headers.get("location") or headers.get("Location")
    assert location, "Location ausente no redirecionamento de erro"
    assert "#auth_error=" in location, "Fragmento #auth_error= ausente no redirecionamento"
    print(f"  ✔ Redirecionamento resiliente de erro para frontend validado com sucesso!")

    print("\n" + "=" * 60)
    print("🎉 TODAS AS VALIDAÇÕES E2E DE AUTENTICAÇÃO E SEGURANÇA PASSARAM!")
    print("=" * 60)


if __name__ == "__main__":
    try:
        run_e2e_auth_verification()
    except Exception as e:
        print(f"\n❌ Erro na validação E2E de autenticação: {e}")
        sys.exit(1)
