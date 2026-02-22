FROM node:24.13-alpine AS base
RUN apk add --no-cache curl
ENV HUSKY=0
WORKDIR /app
ARG FRONTEND_PORT=4200
ENV FRONTEND_PORT=$FRONTEND_PORT
ARG VITE_SERVICE_URL
ENV VITE_SERVICE_URL=$VITE_SERVICE_URL
EXPOSE $FRONTEND_PORT
COPY package*.json nx.json tsconfig*.json ./

FROM base AS development
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=1
ENV WATCHPACK_POLLING=true
ENV NX_DAEMON=true
RUN npm ci
CMD ["npx", "nx", "serve", "frontend", "--host=0.0.0.0"]

FROM base AS builder
COPY tsconfig.base.json ./
COPY nx.json ./
RUN npm ci
COPY apps/frontend ./apps/frontend
RUN npx nx build frontend --prod

FROM nginx:alpine AS production
COPY --from=builder /app/dist/apps/frontend /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
