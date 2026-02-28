FROM node:24.13-alpine AS base
RUN apk add --no-cache curl
ENV HUSKY=0
WORKDIR /app
ARG PORT
EXPOSE $PORT
COPY package*.json nx.json tsconfig*.json ./

FROM base AS development
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=1
ENV WATCHPACK_POLLING=true
ENV NX_DAEMON=true
RUN npm ci
CMD ["/bin/sh", "-c", "npx nx prisma:generate backend && npx nx serve backend"]

FROM base AS builder
COPY tsconfig.base.json ./
COPY nx.json ./
RUN npm ci
COPY apps/backend ./apps/backend
RUN npx nx prisma:generate backend
RUN npx nx build backend --prod

FROM base AS production
ENV NODE_ENV=production
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/dist/apps/backend ./dist
COPY apps/backend/data /data
CMD ["node", "dist/main.js"]
