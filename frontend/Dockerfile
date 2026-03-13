# 1. Instalar dependências
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Se você usa npm, mantém esses dois. Se usa yarn, troque para yarn.lock
COPY package.json package-lock.json* ./ 
RUN npm ci

# 2. Construir o projeto
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Argumento para injetar a URL do backend na hora do build
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# 3. Rodar a aplicação
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# O segredo do standalone: ele precisa das permissões corretas
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
# Define o hostname para 0.0.0.0 para aceitar conexões externas no Docker
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
