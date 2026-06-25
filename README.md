# RouterGui Virtual CPE

Professional TR-069 compatible virtual residential router simulator.

**Manufacturer:** RouterGui  
**Model:** RGX-5000  
**OS:** RGOS 1.0.0  
**Hardware:** RGX-HW-A1

## Stack

- **Frontend:** React, Vite, TypeScript, Material UI, Zustand
- **Backend:** Node.js, Express, TypeScript, SQLite, Prisma, WebSocket
- **Shared:** TypeScript types and TR-098 constants

## Quick Start

```bash
pnpm install
cp .env.example backend/.env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- WebSocket: ws://localhost:3001/ws

**Default login:** `admin` / `RgX5000!Secure#2026` (same password for `user` and `tech` demo accounts)

## Project Structure

```
RouterGui/
├── frontend/     # React router GUI
├── backend/      # Express API + CWMP client
├── shared/       # Shared types and constants
└── docs/         # Architecture and roadmap
```

## TR-069

The backend implements a CWMP client supporting:

- Inform
- GetParameterValues
- SetParameterValues
- GetParameterNames
- Reboot
- FactoryReset

Configure ACS URL via Network → TR-069 or `InternetGatewayDevice.ManagementServer.URL`.

### IXC ACS / Connection Request

The CPE reports `ConnectionRequestURL` on every Inform. **IXC blocks `localhost` and private IPs** (SSRF protection), so you must expose the backend with a **public URL**:

1. Start a tunnel to port `3001`, e.g. `cloudflared tunnel --url http://localhost:3001` or `ngrok http 3001`
2. Set in `backend/.env`:
   ```
   PUBLIC_BASE_URL=https://your-tunnel-host.example.com
   ```
3. Restart the backend and trigger a new Inform (save ACS config or reboot backend)

The public endpoint is `PUBLIC_BASE_URL` + `/cwmp/connection-request` (no JWT; optional HTTP Digest via `CONNECTION_REQUEST_USERNAME` / `CONNECTION_REQUEST_PASSWORD`).

Check the reported URL under **Network → TR-069 → Connection Request**.

## Documentation

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for system design.
# CPE
