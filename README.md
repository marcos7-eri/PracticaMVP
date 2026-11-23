# Parqueo Fácil

MVP de gestión de estacionamiento para un equipo de dos personas. Permite ver plazas, registrar entradas y salidas, calcular una tarifa de Bs 5 por hora o fracción y consultar el historial. El frontend está separado en `frontend/` con Next.js; el backend está en `backend/` con NestJS y SQLite de Node 22.

## Ejecutar localmente

Requiere Node.js 22 y npm.

```bash
npm ci
npm ci --prefix frontend
npm ci --prefix backend
npm run dev
```

Abre `http://localhost:3000`. La API está en `http://localhost:3001/api`; Next.js redirige `/api` al backend. SQLite se guarda en `backend/data/parking.sqlite` y comienza con ocho plazas.

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

- Push a `dev`: pruebas unitarias, integración, E2E, compilación, imágenes Docker y un plan de Terraform en OCI (sin crear recursos).
- Push a `main`: mismas pruebas; después publica `DOCKERHUB_USERNAME/parking-frontend` y `DOCKERHUB_USERNAME/parking-backend` para AMD64 y ARM64 con etiquetas `latest` y SHA. Si `ENABLE_DEPLOY=true`, crea/actualiza infraestructura OCI y configura la VM con Ansible.

Configura estos *secrets* en GitHub: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`; para despliegue también `OCI_TENANCY_OCID`, `OCI_USER_OCID`, `OCI_COMPARTMENT_OCID`, `OCI_FINGERPRINT`, `OCI_API_PRIVATE_KEY`, `OCI_NAMESPACE`, `SSH_PRIVATE_KEY`, `SSH_PUBLIC_KEY` y `TF_STATE_BUCKET`. Crea previamente un bucket privado de OCI Object Storage con versionado para el estado de Terraform. La variable de repositorio `OCI_REGION` puede fijarse a `sa-saopaulo-1` y `ENABLE_DEPLOY=true` solo cuando credenciales, claves y bucket estén listos. `SSH_PRIVATE_KEY` y `SSH_PUBLIC_KEY` deben ser el mismo par Ed25519; nunca subas claves privadas al repositorio.

Terraform crea una VCN, subred pública, gateway, rutas, lista de seguridad y VM Ubuntu 24.04 con IP pública en OCI. La forma elegida es de pago: `VM.Standard.A2.Flex` con 1 OCPU y 4 GB. Según la tarifa pública de Oracle de US$0,0183484/OCPU-h y US$0,0026212/GB-h, el cómputo estimado es US$0,0288332/h, o US$21,05 por 730 horas; almacenamiento y otros consumos pueden sumarse. Ansible instala Docker, Git, UFW e iptables; permite 22, 80 y 443, y ejecuta los contenedores de la aplicación y Cloudflare. El puerto 443 queda preparado para HTTPS directo; Cloudflare ofrece HTTPS en su URL pública.

## URL HTTPS con Cloudflare

Ansible ejecuta `cloudflare/cloudflared` como un servicio de Docker Compose y crea una URL temporal `https://...trycloudflare.com` sin necesitar cuenta ni dominio. La URL actual aparece en los registros de la VM:

```bash
sudo docker compose -f /opt/parking/docker-compose.yml logs cloudflare | grep trycloudflare.com
```

Abre esa URL para ver la aplicación por HTTPS; `/api/health` también funciona a través del túnel. Los Quick Tunnels de Cloudflare son para pruebas y desarrollo: la dirección cambia si se recrea el túnel y no tiene garantía de disponibilidad. Para una dirección fija de entrega o producción, se necesita una cuenta de Cloudflare y configurar un túnel con un dominio propio.

## Escritorio remoto VNC

Ansible instala XFCE, TigerVNC y noVNC en la VM Ubuntu. VNC (`5901`) y noVNC (`6080`) escuchan solo en `localhost` de la VM y no se abren en la VCN ni en UFW. Para acceder desde Windows, abre PowerShell y mantén esta conexión SSH abierta:

```powershell
ssh -i "$env:USERPROFILE\.ssh\parking_oci" -N -L 6080:127.0.0.1:6080 ubuntu@IP_PUBLICA_ACTUAL
```

Después abre `http://localhost:6080/vnc.html` en tu navegador y pulsa **Connect**. La sesión VNC no solicita una segunda contraseña porque el acceso está limitado al túnel SSH; protege la clave privada y cierra la terminal SSH para terminar el acceso. El escritorio se inicia automáticamente al arrancar la VM. Para verificarlo dentro de la VM: `systemctl status parking-vnc parking-novnc`.

## Reparto sugerido para dos personas

- Persona 1: frontend Next.js, estilos y pruebas E2E.
- Persona 2: backend NestJS, SQLite y pruebas unitarias/de integración.
- Ambos: revisión del pipeline, Docker e infraestructura.

## Endpoints

`GET /api/spots`, `POST /api/spots`, `GET /api/stays`, `POST /api/stays`, `POST /api/stays/:id/exit`, `GET /api/summary`, `GET /api/health`.
