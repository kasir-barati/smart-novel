FROM node:24.13-alpine AS base
RUN apk add --no-cache curl
ENV HUSKY=0
WORKDIR /app
COPY package*.json ./
RUN chown -R 1000:1000 /app
USER 1000:1000
ARG PORT
EXPOSE $PORT

FROM base AS development
ENV NODE_ENV=development
RUN npm ci
CMD ["npx", "nx", "serve", "backend"]

FROM base AS builder
COPY tsconfig.base.json ./
COPY nx.json ./
RUN npm ci
COPY apps/backend ./apps/backend
RUN npx nx build backend --prod

FROM base AS production
ENV NODE_ENV=production
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=builder /app/dist/apps/backend ./dist
COPY apps/backend/data ./data
CMD ["node", "dist/main.js"]
