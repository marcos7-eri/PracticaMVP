# Parqueo Fácil

MVP de gestión de estacionamiento para un equipo de dos personas. Permite ver plazas, registrar entradas y salidas, calcular una tarifa de Bs 5 por hora o fracción y consultar el historial. El frontend usa React y Vite; el backend usa Express y SQLite de Node 22.

## Ejecutar localmente

Requiere Node.js 22 y npm.

```bash
npm ci
npm run dev
```

Abre `http://localhost:5173`. La API está en `http://localhost:3001/api`. SQLite se guarda en `data/parking.sqlite` y comienza con ocho plazas.

## Pruebas

```bash
npx playwright install chromium
npm test
npm run build
```

Hay seis pruebas unitarias, seis de integración con SQLite y seis E2E con Playwright. Las pruebas E2E usan una base SQLite separada para no modificar los datos locales de la aplicación.

## Docker

```bash
docker compose up --build -d
```

La aplicación queda en `http://localhost`; `parking_data` conserva SQLite entre reinicios.

## GitHub Actions

- Push a `dev`: pruebas unitarias, integración, E2E y compilación.
- Push a `main`: mismas pruebas; después publica `DOCKERHUB_USERNAME/parking-mvp` con etiquetas `latest` y SHA. Si `ENABLE_DEPLOY=true`, crea/actualiza infraestructura AWS y configura la VM con Ansible.

Configura estos *secrets* en GitHub: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`; para despliegue también `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `SSH_PRIVATE_KEY`, `SSH_PUBLIC_KEY`, `TF_STATE_BUCKET`. Crea previamente un bucket S3 privado para el estado de Terraform y configura la variable de repositorio `ENABLE_DEPLOY=true` solo cuando las credenciales y el bucket estén listos. `SSH_PRIVATE_KEY` y `SSH_PUBLIC_KEY` deben ser el mismo par Ed25519; nunca subas la clave privada al repositorio.

Terraform crea una VPC, subred pública, gateway, rutas, grupo de seguridad, VM Ubuntu 24.04 y Elastic IP. Ansible instala Docker, Git, UFW e iptables; permite 22, 80 y 443, y ejecuta la imagen Docker. El puerto 443 queda preparado para añadir TLS cuando haya dominio. AWS, Elastic IP y S3 pueden generar cargos.

## Reparto sugerido para dos personas

- Persona 1: interfaz React, estilos y pruebas E2E.
- Persona 2: API Express, SQLite y pruebas unitarias/de integración.
- Ambos: revisión del pipeline, Docker e infraestructura.

## Endpoints

`GET /api/spots`, `POST /api/spots`, `GET /api/stays`, `POST /api/stays`, `POST /api/stays/:id/exit`, `GET /api/summary`, `GET /api/health`.
