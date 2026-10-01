FROM node:24-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# --- Bog'liqliklar ---
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# --- Local ishlab chiqish: kod va node_modules volume orqali ulanadi ---
FROM base AS dev
ENV NODE_ENV=development
COPY package.json package-lock.json ./
CMD ["sh", "-c", "npm install --no-audit --no-fund && npm run dev -- --hostname 0.0.0.0"]

# --- Production build ---
FROM base AS build
# NEXT_PUBLIC_* qiymatlari build paytida kodga yoziladi, .env esa image'ga kirmaydi
# (.dockerignore). Shuning uchun ular build argumenti sifatida beriladi.
ARG NEXT_PUBLIC_APP_URL=http://localhost
ARG NEXT_PUBLIC_S3_PUBLIC_URL=http://localhost:9000/sifat-public
ARG NEXT_PUBLIC_SENTRY_DSN=
ARG NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL     NEXT_PUBLIC_S3_PUBLIC_URL=$NEXT_PUBLIC_S3_PUBLIC_URL     NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN     NEXT_PUBLIC_SENTRY_ENVIRONMENT=$NEXT_PUBLIC_SENTRY_ENVIRONMENT
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Production runtime (standalone) ---
FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
