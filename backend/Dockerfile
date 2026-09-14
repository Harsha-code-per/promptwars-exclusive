FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY seeds ./seeds
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/seeds ./seeds
COPY --from=builder /app/src/db/migrations ./dist/db/migrations

EXPOSE 3000
CMD ["node", "dist/server.js"]
