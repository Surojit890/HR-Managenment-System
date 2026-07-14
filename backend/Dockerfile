FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

RUN npm prune --omit=dev


FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN npm install prisma@5.22.0 && npm install -g tsx@4.19.2

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate resolve --rolled-back 20260711000000_enable_rls_audit_logs 2>/dev/null || true; npx prisma migrate deploy && node dist/src/main.js"]
