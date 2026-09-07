FROM node:20-alpine

WORKDIR /app

# Instalação das dependências
COPY package*.json ./
RUN npm install

# Cópia do código-fonte
COPY . .

# Porta padrão de execução do Vite
EXPOSE 3000

# Inicia o servidor de desenvolvimento do Vite acessível externamente
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
