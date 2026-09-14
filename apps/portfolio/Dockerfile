FROM node:20-alpine

WORKDIR /app

# Instalação das dependências
COPY package*.json ./
RUN npm install

# Cópia do código-fonte
COPY . .

# Porta padrão do Vite para a Landing Page
EXPOSE 3001

# Inicia o servidor Vite na porta 3001
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3001"]
