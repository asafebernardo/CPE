# AeroBerry Virtual CPE — Roadmap

## v1.0 (Current)

- TR-098 parameter tree in SQLite
- CWMP client: Inform, Get/Set ParameterValues, GetParameterNames, Reboot, FactoryReset
- Real ACS connection (GenieACS, etc.)
- Full router GUI (Dashboard, WAN, LAN, Wireless, Firewall, Logs, Diagnostic, Management)
- WebSocket live metrics
- Single virtual CPE (architecture ready for multi-device)

## v1.1

- Connection Request handling (ACS-initiated sessions)
- Download/Upload TR-069 methods (structure)
- Improved SOAP parsing for diverse ACS implementations
- ACS credential Digest auth refinement

## v2.0 — TR-181

- `Device.` data model parallel to TR-098
- `IDataModelAdapter` with `Tr181Adapter` implementation
- TR-098 → TR-181 parameter mapping layer
- Dual-model Inform support

## v2.5 — Multi-CPE

- `DeviceOrchestratorService` for N virtual routers
- API: `POST /devices`, `GET /devices`, device selector in UI
- Per-device CWMP sessions and Inform schedulers
- SQLite optimization for hundreds of CPEs

## v3.0 — TR-369 USP

- `UspAgent` in `infrastructure/usp/`
- MQTT transport via `mqtt.js`
- WebSocket USP transport
- `ITransportAdapter` with `UspTransport` implementation

## v3.5 — Controller & NOC

- WebSocket Controller for orchestrating N CPEs
- Integration with Helpers-ACS NOC panel
- Bulk Inform, bulk parameter operations
- Fleet dashboard

## Architecture Principles (Maintained)

- Clean Architecture layer separation
- SOLID: single-responsibility handlers and repositories
- Event-driven internal communication
- Shared types package for API contracts
