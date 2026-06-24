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

**Default login:** `admin` / `admin`

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

Configure ACS URL via Management page or `InternetGatewayDevice.ManagementServer.URL`.

## Documentation

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for system design.
# CPE
