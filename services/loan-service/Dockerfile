FROM eclipse-temurin:17-jre
WORKDIR /app
COPY target/loan-service-1.0.0.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75","-jar","/app/app.jar"]
