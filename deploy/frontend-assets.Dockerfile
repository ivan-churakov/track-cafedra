# Lightweight update of public assets; app code and runtime come from the base image.
ARG FRONTEND_IMAGE=track-cafedra/frontend:local
FROM ${FRONTEND_IMAGE}
COPY --chown=node:node public/ /app/public/
