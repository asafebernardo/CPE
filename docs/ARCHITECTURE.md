# RouterGui Virtual CPE — Architecture

## Overview

RouterGui Virtual CPE is a monorepo simulating a TR-069 compatible residential router (RGX-5000). It follows Clean Architecture with clear separation between presentation, application, domain, and infrastructure layers.

## Monorepo Structure

```
RouterGui/
├── shared/     # TypeScript types, TR-098 constants, serial generator
├── backend/    # Express API, CWMP client, Prisma/SQLite, WebSocket
├── frontend/   # React + Vite + MUI router GUI
└── docs/       # Architecture, parameters, roadmap
```

## Layer Diagram

```
Presentation (Express routes, WebSocket)
        ↓
Application (Services, Use Cases)
        ↓
Domain (Entities, Interfaces, IDataModelAdapter)
        ↓
Infrastructure (Prisma, CWMP SOAP, WS Hub)
```

## Core Services

### ParameterTreeService

Central TR-069 parameter management:

- Loads TR-098 tree from SQLite
- Handles GetParameterValues, SetParameterValues, GetParameterNames
- Bidirectional sync between TR-098 parameters and domain models (WAN/LAN/WLAN)
- Builds Inform parameter lists

### CwmpClient

SOAP-over-HTTP client connecting to real ACS:

- Inform with event codes (BOOT, PERIODIC, VALUE CHANGE, Reboot)
- Responds to ACS methods: Get/Set ParameterValues, GetParameterNames, Reboot, FactoryReset
- Session loop until empty response

### DeviceSimulatorService

Simulates router metrics:

- CPU/Memory random walk
- Uptime from boot time
- Ping and Traceroute with simulated latency

## Multi-Device Preparation

All data is scoped by `deviceId` on `VirtualDevice`. v1 seeds one default device; future versions add device orchestration without schema changes.

## Data Model Adapters

- `Tr098Adapter` — active TR-098 implementation
- `Tr181Adapter` — stub for TR-181 Device tree
- `ITransportAdapter` — prepared for CWMP, USP/MQTT (future)

## Event Bus

Internal `EventEmitter` decouples:

- CWMP sessions → WebSocket notifications
- Parameter changes → Logs
- Device reboot/reset → UI updates

## API

REST at `/api/*` with JWT auth. WebSocket at `/ws` with token query param.

## Database

SQLite via Prisma with 12 models: User, VirtualDevice, Tr098Parameter, WanConfig, LanConfig, WlanConfig, FirewallRule, PortForward, DmzConfig, LogEntry, CwmpSession, SimulatedMetrics, DeviceSnapshot.
