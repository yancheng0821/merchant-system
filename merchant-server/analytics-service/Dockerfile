# ============================================
# Analytics Service - Dockerfile (Spring Boot)
# ============================================

FROM eclipse-temurin:17-jre-alpine AS runtime

WORKDIR /app

# Copy built JAR
COPY analytics-service/target/*.jar app.jar

# Create non-root user and required directories
RUN addgroup -S spring && adduser -S spring -G spring && \
    mkdir -p /app/logs /var/uploads && \
    chown -R spring:spring /app /var/uploads

USER spring:spring

# Health check (update port if needed)
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8090/actuator/health || exit 1

# Expose service port (modify if your service uses different port)
EXPOSE 8086

# JVM options for container
ENV JAVA_OPTS="-Xms384m -Xmx768m -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

# Run the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
