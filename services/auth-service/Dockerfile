FROM eclipse-temurin:17-jre
WORKDIR /app
COPY target/auth-service-1.0.0.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75","-jar","/app/app.jar"]
