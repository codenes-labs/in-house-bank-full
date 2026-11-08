# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN chmod +x scripts/docker-prod-entrypoint.sh
EXPOSE 8787
ENTRYPOINT ["./scripts/docker-prod-entrypoint.sh"]
