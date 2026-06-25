# AeroBerry Virtual CPE — Checklist de implementação

Objetivo: cobrir funcionalidades típicas de CPE residencial/ONT em **simulação funcional**.

Legenda: `[ ]` pendente · `[~]` em progresso · `[x]` concluído

---

## Fase 1 — Fundação (modelos + simulação)

- [x] Modelo Prisma `ConnectedHost`
- [x] Modelo Prisma `WifiNeighbor`
- [x] Modelo Prisma `BandSteeringConfig`
- [x] Modelo Prisma `SpeedTestResult`
- [x] Modelo Prisma `Ipv6Config`
- [x] Modelo Prisma `GuestWlanConfig`
- [x] Modelo Prisma `DhcpReservation`
- [x] Modelo Prisma `StaticRoute`
- [x] Modelo Prisma `UpnpConfig`
- [x] Modelo Prisma `QosRule`
- [x] Modelo Prisma `VpnConfig`
- [x] Modelo Prisma `FirmwareInfo`
- [x] Modelo Prisma `NtpConfig`
- [x] Modelo Prisma `OpticalInfo` (ONT)
- [x] Modelo Prisma `VoipLine` (ONT)
- [x] Serviço `CpeSimulatorService`
- [x] Seed via bootstrap (`seedCpeData`)
- [x] Types em `shared/`

## Fase 2 — TR-098 expandido

- [ ] Paths TR-098 para hosts
- [ ] Paths Wi-Fi avançado
- [ ] Paths IPv6, óptico, VoIP
- [ ] `Tr098Adapter` atualizado
- [ ] Sync em `ParameterTreeService`

## Fase 3 — TR-069 expandido

- [ ] Download / Upload
- [ ] AddObject / DeleteObject
- [ ] TransferComplete / GetRPCMethods
- [ ] Set/GetParameterAttributes
- [ ] Connection Request real

## Fase 4 — APIs REST

- [x] `/api/hosts`
- [x] `/api/wifi/neighbors` + scan
- [x] `/api/wifi/band-steering`
- [x] `/api/diagnostic/speedtest` + history
- [x] `/api/cpe/ipv6`, `/api/cpe/guest-wifi`, `/api/cpe/upnp`, `/api/cpe/qos`, `/api/cpe/vpn`
- [x] `/api/cpe/routes`, `/api/cpe/dhcp/reservations`, `/api/cpe/ntp`
- [x] `/api/cpe/optical`, `/api/cpe/firmware`, `/api/cpe/voip`

## Fase 5 — Frontend

- [x] Connected Hosts
- [x] Wi-Fi Advanced (band steering + neighbor scan)
- [x] Speed Test
- [x] IPv6, Guest, QoS, VPN, UPnP, Routes, DHCP, Firmware, System, ONT, VoIP
- [x] Sidebar reorganizada

## Fase 6 — WebSocket

- [x] `hosts.updated`
- [x] `neighbors.scanned`
- [x] `bandsteering.changed`
- [x] `speedtest.completed`
- [x] `firmware.upgrade.progress`

## Fase 7 — Prioridade explícita

- [x] Hosts conectados
- [x] Band steering
- [x] Neighbor scan
- [x] Speedtest

## Critérios de aceite

- [x] `pnpm dev` sem erros
- [x] Typecheck ok (shared, backend, frontend)
- [x] migrate aplicado
- [x] Novas páginas na sidebar
