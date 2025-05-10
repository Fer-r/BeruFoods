# BeruFoods Project

Este proyecto utiliza Docker y Docker Compose para crear un entorno de desarrollo consistente para una aplicación web que consiste en un frontend Vite/React y un backend Symfony PHP, servidos a través de Nginx y respaldados por una base de datos MySQL.

## Descripción de la Pila Tecnológica

*   **Frontend:** Vite con React (Servido en modo desarrollo en `http://localhost:5173`)
*   **Backend:** Symfony 7+ (PHP 8.2 FPM)
*   **Servidor Web:** Nginx (Proxy inverso para el backend y servidor de archivos estáticos, accesible en `http://localhost:80`)
*   **Base de Datos:** MySQL 8.0
*   **Gestión de Base de Datos:** phpMyAdmin (Accesible en `http://localhost:8080`)
*   **Contenedorización:** Docker & Docker Compose

## Prerrequisitos

*   Docker ([Instrucciones de Instalación](https://docs.docker.com/engine/install/))
*   Docker Compose ([Instrucciones de Instalación](https://docs.docker.com/compose/install/))
*   Make (Opcional, pero recomendado para usar los comandos del `Makefile`)

## Configuración Inicial

1.  **Clonar el Repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd BeruFoods
    ```

2.  **Crear archivo `.env`:**
    Copia el archivo `.env.example` (si existe) o crea un nuevo archivo llamado `.env` en la raíz del proyecto. Este archivo contendrá las variables de entorno secretas para Docker Compose. Asegúrate de definir al menos las siguientes variables:
    ```dotenv
    # .env (NO AÑADIR A GIT)

    # Base de Datos
    MYSQL_ROOT_PASSWORD=root_password_secret
    MYSQL_DATABASE=berufoods_db
    MYSQL_USER=berufoods_user
    MYSQL_PASSWORD=user_password_secret

    # Symfony
    APP_ENV=dev
    APP_SECRET=tu_secreto_aqui # Cambia esto por un secreto real

    # Opcional: Versión de MySQL si es diferente a la configurada en docker-compose.yml
    # MYSQL_VERSION=8.0
    ```
    *Importante:* El `MYSQL_DATABASE`, `MYSQL_USER`, y `MYSQL_PASSWORD` aquí deben coincidir con los valores que usará Symfony (inyectados como `DB_NAME`, `DB_USER`, `DB_PASSWORD` a través de `docker-compose.yml`).

3.  **Permisos de Ejecución (si es necesario):**
    Asegúrate de que el script de consola de Symfony sea ejecutable en tu máquina host (debido al montaje de volúmenes):
    ```bash
    chmod +x backend/bin/console
    ```

4.  **Construir e Iniciar los Contenedores:**
    Usa el comando `make init` para una inicialización completa. Esto detendrá contenedores existentes, construirá las imágenes, iniciará los servicios, instalará dependencias (Composer y npm), ejecutará migraciones de base de datos y calentará la caché de Symfony.
    ```bash
    make init
    ```
    Alternativamente, para solo construir e iniciar:
    ```bash
    make up
    ```

## Acceso a los Servicios

*   **Aplicación Web (vía Nginx):** [http://localhost:80](http://localhost:80)
    *   Nginx sirve el `index.php` del backend y los archivos estáticos desde `backend/public`.
    *   Las peticiones PHP son enviadas al servicio `backend` (PHP-FPM).
*   **Frontend Dev Server (directo):** [http://localhost:5173](http://localhost:5173)
    *   Útil para ver el frontend directamente con HMR (Hot Module Replacement).
*   **phpMyAdmin:** [http://localhost:8080](http://localhost:8080)
    *   Usuario: `root`
    *   Contraseña: La `MYSQL_ROOT_PASSWORD` definida en tu `.env`.
    *   Servidor: `database` (normalmente prellenado)

## Comandos Útiles (`Makefile`)

El `Makefile` proporciona atajos convenientes para las operaciones comunes de Docker Compose:

*   `make init`: Inicialización completa (build, up, install, db, cache).
*   `make up`: Construir (si es necesario) e iniciar contenedores en segundo plano.
*   `make down`: Detener y eliminar contenedores y redes.
*   `make stop`: Detener contenedores en ejecución.
*   `make restart`: Reiniciar contenedores.
*   `make build`: Forzar la reconstrucción de las imágenes Docker.
*   `make logs`: Ver logs de todos los servicios.
*   `make logs-backend`: Ver logs solo del servicio `backend`.
*   `make logs-frontend`: Ver logs solo del servicio `frontend`.
*   `make bash`: Conectar a la shell del contenedor `backend` (como `www-data`).
*   `make bash-frontend`: Conectar a la shell del contenedor `frontend`.
*   `make install`: Instalar dependencias Composer (backend) y npm (frontend).
*   `make db`: Ejecutar migraciones de base de datos Doctrine.
*   `make migration`: Generar un nuevo archivo de migración Doctrine.
*   `make cache`: Limpiar y calentar la caché de Symfony.
*   `make cache-clear`: Solo limpiar la caché de Symfony.
*   `make test-backend`: Ejecutar tests PHPUnit en el backend.
*   `make frontend`: Construir assets del frontend para producción (ejecuta `npm run build`).

Para ver todos los comandos disponibles, ejecuta `make help` o simplemente `make`.


