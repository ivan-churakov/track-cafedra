# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM dependencies AS build
COPY . .
ARG NEXT_PUBLIC_API_URL=""
ARG NEXT_PUBLIC_STUDY_PLAN_ID_1=1
ARG NEXT_PUBLIC_STUDY_PLAN_ID_2=2
ARG NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=""
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_STUDY_PLAN_ID_1=$NEXT_PUBLIC_STUDY_PLAN_ID_1 \
    NEXT_PUBLIC_STUDY_PLAN_ID_2=$NEXT_PUBLIC_STUDY_PLAN_ID_2 \
    NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=$NEXT_PUBLIC_TELEGRAM_BOT_USERNAME \
    BACKEND_INTERNAL_URL=http://backend:8080
RUN npm run build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 \
    BACKEND_INTERNAL_URL=http://backend:8080
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
