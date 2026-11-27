# Build context is track-cafedra-backend/target after successful Maven verify.
FROM eclipse-temurin:21-jre-jammy
RUN groupadd --system spring \
 && useradd --system --gid spring --uid 1001 --create-home --shell /usr/sbin/nologin spring \
 && mkdir -p /app /var/lib/track-cafedra/storage \
 && chown -R spring:spring /app /var/lib/track-cafedra/storage \
 && apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --chown=spring:spring backend-*.jar /app/app.jar
USER spring
ENV JAVA_OPTS="-XX:MaxRAMPercentage=60.0 -Djava.awt.headless=true"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
