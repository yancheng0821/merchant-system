# ============================================
# Eureka Server - 快速Dockerfile（使用本地JAR）
# ============================================

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy jar from local build
COPY eureka-server/target/*.jar app.jar

# Create non-root user and logs directory
RUN addgroup -S spring && adduser -S spring -G spring && \
    mkdir -p /app/logs && \
    chown -R spring:spring /app/logs
USER spring:spring

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8761/actuator/health || exit 1

# Expose port
EXPOSE 8761

# JVM options for container
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

# Run application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
