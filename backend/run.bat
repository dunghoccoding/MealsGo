@echo off
echo ========================================
echo   Dacsan Backend - Quick Test
echo ========================================
echo.

echo [1/3] Checking if database exists...
echo Please make sure PostgreSQL is running and database 'dacsan_db' is created.
echo If not, open pgAdmin and run: CREATE DATABASE dacsan_db;
echo.
pause

echo [2/3] Building and starting Spring Boot...
echo This may take 1-2 minutes...
echo.
call mvn spring-boot:run -Dspring-boot.run.profiles=dev

echo.
echo ========================================
echo Backend should be running at:
echo http://localhost:8080
echo.
echo Swagger UI:
echo http://localhost:8080/swagger-ui.html
echo ========================================
pause
