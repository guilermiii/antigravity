FROM python:3.11-slim

# Evita que o Python gere arquivos .pyc e permite que o buffer de stdout/stderr saia imediatamente
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Instala dependências do sistema necessárias se houver
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instala as dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação e migrações
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .

# Expõe a porta que a aplicação irá rodar
EXPOSE 8000

# Executa a aplicação usando uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
