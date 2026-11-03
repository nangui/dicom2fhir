# HAPI with a compiled healthcheck.
# The upstream image is distroless with a JRE only: no shell, no curl, and no
# jdk.compiler, so `java Health.java` (source launcher) cannot run there.
# Compile with a JDK in a throwaway stage, ship only the .class file.
FROM eclipse-temurin:21.0.13_9-jdk-alpine-3.24 AS healthcheck
COPY Health.java /src/
RUN javac --release 21 -d /out /src/Health.java

FROM hapiproject/hapi:v8.12.0-2
COPY --from=healthcheck /out/Health.class /healthcheck/
