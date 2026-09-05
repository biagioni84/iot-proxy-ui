# Gateway Device UI — Specification for cloud-side agent

## Overview

The gateway exposes a REST API (port 9098, localhost-only) that is also mirrored 1:1 over MQTT.
The cloud-side UI **must not** call the gateway HTTP API directly — all commands must go through
the cloud→gateway MQTT relay (`GatewayApiService.dispatch(method, path, bodyJson)`).

All API paths are prefixed with `/api/v1`. MQTT paths must use the same prefix
(e.g. `/api/v1/summary`). The prefix is stripped automatically before internal routing.

Authentication: `X-Api-Key` header (when `gateway.api.key` is set).

---

## 1. Device list

### Endpoint
```
GET /api/v1/summary
```

### Response shape
```json
{
  "gw_id": "abc123",
  "fw_version": "0.1",
  "time": "2026-03-26T12:00:00-03:00",
  "timezone": "America/Montevideo",
  "devices": {
    "<uuid>": { /* device object — see below */ }
  }
}
```

### Device object (common fields)
| Field | Type | Notes |
|---|---|---|
| `id` | string | UUID — use as key for all device API calls |
| `protocol` | `"zwave"` \| `"zigbee"` | |
| `name` | string \| null | User-assigned friendly name |
| `node` | string | Z-Wave: hex node id (e.g. `"0x06"`); Zigbee: IEEE EUI-64 |
| `type` | string | `"lock"`, `"switch"`, `"thermostat"`, `"sensor"`, etc. |
| `manufacturer` | string \| null | |
| `modelId` | string \| null | |
| `descriptor` | string \| null | Matched descriptor filename, or `"unknown"` |
| `status` | string \| null | `"locked"` \| `"unlocked"` (locks) or `"on"` \| `"off"` (switches) |
| `battery` | integer \| null | Percentage 0–100; null if not reported |

---

## 2. Device detail

```
GET /api/v1/{deviceId}
```

Returns same device object as above. Use to refresh a single device.

---

## 3. Controls by device type

### 3a. Lock (`type = "lock"`)

**Display:** status badge (locked/unlocked), battery level, pincode list.

**Controls:**

| Action | Method | Path | Body |
|---|---|---|---|
| Lock | POST | `/api/v1/{id}/lock` | `{ "value": "lock" }` |
| Unlock | POST | `/api/v1/{id}/lock` | `{ "value": "unlock" }` |
| Get current state | GET | `/api/v1/{id}/lock` | — |
| List cached pincodes | GET | `/api/v1/{id}/poll_pincodes` | — |
| Set pincode | POST | `/api/v1/{id}/pincode/{slot}` | `{ "code": "1234" }` |
| Delete pincode | DELETE | `/api/v1/{id}/pincode/{slot}` | — |
| Read pincode from device | GET | `/api/v1/{id}/pincode/{slot}` | — (slow, polls device) |

Pincode slots are integers 1–10 (configurable per device descriptor).
`GET /api/v1/{id}/poll_pincodes` returns `{ "pincodes": { "1": "1234", "3": "5678" } }` from cache.
Slot absent from the map = empty/unset.

**Zigbee locks only:** the `pincode` POST also accepts `{ "code": "1234", "type": "..." }`.

---

### 3b. Switch (`type = "switch"`)

**Display:** on/off toggle, optional battery badge.

| Action | Method | Path | Body |
|---|---|---|---|
| Turn on | POST | `/api/v1/{id}/switch` | `{ "value": "on" }` |
| Turn off | POST | `/api/v1/{id}/switch` | `{ "value": "off" }` |
| Get current state | GET | `/api/v1/{id}/switch` | — |

Zigbee also accepts `POST /api/v1/{id}/on` and `POST /api/v1/{id}/off` (no body).

---

### 3c. Multilevel switch / dimmer (`type = "switch"`, Z-Wave only, when `level` command works)

**Display:** slider 0–99.

| Action | Method | Path | Body |
|---|---|---|---|
| Set level | POST | `/api/v1/{id}/level` | `{ "value": 50 }` |
| Get level | GET | `/api/v1/{id}/level` | — |

---

### 3d. Thermostat (`type = "thermostat"`, Z-Wave only)

**Display:** current mode chip, heat setpoint, cool setpoint.

| Action | Method | Path | Body |
|---|---|---|---|
| Get state | GET | `/api/v1/{id}/thermostat` | — |
| Set heat setpoint | POST | `/api/v1/{id}/thermostat` | `{ "heat": 21.5 }` |
| Set cool setpoint | POST | `/api/v1/{id}/thermostat` | `{ "cool": 26.0 }` |
| Set mode | POST | `/api/v1/{id}/thermostat` | `{ "mode": "heat" \| "cool" \| "auto" \| "off" }` |
| Set all at once | POST | `/api/v1/{id}/thermostat` | `{ "heat": 21, "cool": 26, "mode": "auto" }` |

`GET /api/v1/{id}/thermostat` returns: `{ "heat": 21.5, "cool": 26.0, "mode": "heat" }`.

---

## 4. Device management

| Action | Method | Path | Body |
|---|---|---|---|
| Rename device | POST | `/api/v1/{id}/name` | `{ "value": "Front Door" }` |
| Delete/unpair device | DELETE | `/api/v1/{id}` | — |
| Subscribe to raw events | POST | `/api/v1/{id}/fwd_event` | `{ "ev": "OperationEventNotification" }` |
| Unsubscribe from event | DELETE | `/api/v1/{id}/fwd_event` | `{ "ev": "OperationEventNotification" }` |

---

## 5. Network operations

### Inclusion (pair new device)
```
POST /api/v1/include
{ "protocol": "zwave" | "zigbee", "command": "start" | "stop" }
```
Open inclusion for ~60 s, then stop. Show spinner + "Put device in pairing mode" prompt.

### Exclusion (unpair by exclusion mode, Z-Wave only)
```
POST /api/v1/exclude
{ "protocol": "zwave", "command": "start" | "stop" }
```

### Re-interview a device
```
POST /api/v1/zwave/interview/{nodeId}     (nodeId = decimal or 0x hex)
```
For Zigbee: not exposed as a dedicated endpoint; re-interview is triggered automatically on next wake-up.

### Refresh Z-Wave node list
```
POST /api/v1/zwave/update_network   {}
```

---

## 6. Sequences

Named lists of device commands. Execution engine is a **stub** — `POST /{id}/run` returns
`{ "status": "started" }` but no steps actually execute yet. Show as read-only list for now
or clearly mark "coming soon" on the Run button.

| Action | Method | Path | Body |
|---|---|---|---|
| List | GET | `/api/v1/sequences` | — |
| Create | POST | `/api/v1/sequences` | `{ "name": "Goodnight", "steps": [...] }` |
| Get | GET | `/api/v1/sequences/{id}` | — |
| Update | PUT | `/api/v1/sequences/{id}` | `{ "name": "...", "steps": [...] }` |
| Delete | DELETE | `/api/v1/sequences/{id}` | — |
| Run (stub) | POST | `/api/v1/sequences/{id}/run` | — |

Step format (not yet enforced by backend): `[{ "device": "<uuid>", "cmd": "lock", "value": "lock" }, ...]`

---

## 7. Schedule

**Not implemented.** All endpoints return `{ "status": "not implemented" }`.
Hide or disable schedule UI until a future release.

---

## 8. MQTT events (for real-time updates)

The gateway publishes events to the cloud MQTT topic `events`. Relevant messages:

```json
{ "type": "INTERVIEW_COMPLETE", "node": "<ieee-or-node>", "device": { /* device object */ } }
{ "type": "zigbee", "node-id": "<nwk>", "payload": { "cmd": "OperationEventNotification", "fields": {...} } }
```

Use `INTERVIEW_COMPLETE` to refresh the device list after pairing.
Use forwarded `OperationEventNotification` for real-time lock status updates without polling.

---

## 9. Common response patterns

```json
{ "status": "ok" }                        // success, no data
{ "status": "ok", "value": ... }          // success with data
{ "error": "device not found: <id>" }     // not found
{ "error": "unauthorized" }               // missing/wrong X-Api-Key
```

Always check for the `"error"` key before treating a 200 response as success.

---

## 10. UI page map (suggested)

| Page | Content |
|---|---|
| Dashboard | `GET /api/v1/summary` → card per device showing type icon, name, status, battery |
| Device detail | Full state + all controls for that device type |
| Pincodes | Pincode slot table with add/delete per slot (locks only) |
| Pairing | Inclusion/exclusion flow with protocol selector |
| Sequences | CRUD list (Run button disabled until engine ships) |
