# Gateway Management UI

Cloud-side web application for managing IoT gateways, devices, and tunnels. Built with React + Material UI.

## Overview

This UI connects to a cloud backend that relays commands to IoT gateways over MQTT. It never calls the gateway HTTP API directly — all device commands go through the cloud proxy endpoint (`/api/v1/{gwId}/proxy/{path}`).

## Features

- **Gateway list** — overview of all gateways with online/offline status and tunnel counts
- **Device management** — list, control, rename, and delete Z-Wave / Zigbee devices per gateway
  - Lock: lock/unlock, pincode slot management (slots 1–10)
  - Switch: on/off toggle; dimmer slider for Z-Wave multilevel switches
  - Thermostat: mode selector, heat/cool setpoints
- **Pairing** — inclusion (Z-Wave + Zigbee) and exclusion (Z-Wave) flows with 60s countdown
- **Sequences** — CRUD list of named device command sequences (execution engine stub)
- **Tunnel management** — create, edit, start, stop, and delete SSH reverse tunnels per gateway
- **Proxy panel** — raw HTTP request tester against the gateway API
- **Light / dark mode**

## Tech stack

| | |
|---|---|
| Framework | React (latest) |
| UI | Material UI v7 + MUI X (DataGrid, DatePickers, Charts) |
| Routing | React Router v7 |
| Data fetching | TanStack React Query v5 |
| Build | Vite |

## Getting started

### Prerequisites

- Node.js 18+
- Access to the cloud backend API

### Setup

```bash
npm install
```

Copy the environment file and fill in your API base URL:

```bash
cp .env.example .env.local
```

`.env.local`:
```
VITE_API_BASE_URL=https://your-api-host/
```

> `.env.local` is git-ignored — never commit real URLs or credentials.

### Running

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run serve
```

## Project structure

```
src/
├── App.jsx                  # Router + LoginContext
├── api.jsx                  # Cloud API service (auth, tunnels, proxy)
├── Shared.jsx               # Base URL from env
│
├── sign-in/                 # Login page
├── dashboard/               # Main dashboard layout + gateway/tunnel UI
│   └── components/
│       ├── SummaryPage.jsx  # Panel-swap controller
│       ├── GatewaysList.jsx # Gateway table (click row → device panel)
│       ├── TunnelList.jsx   # Tunnel CRUD
│       └── ProxyPanel.jsx   # Raw HTTP tester
│
└── gateway/                 # Gateway device UI
    ├── gatewayApi.jsx       # Device API (wraps proxy endpoint)
    ├── DevicesPage.jsx      # Device list + view router
    ├── DeviceDetail.jsx     # Device detail + rename/delete/re-interview
    ├── PairingPanel.jsx     # Inclusion / exclusion flows
    ├── SequencesPanel.jsx   # Sequences CRUD
    └── components/
        ├── DeviceCard.jsx
        ├── LockControl.jsx
        ├── SwitchControl.jsx
        ├── ThermostatControl.jsx
        └── PincodesPanel.jsx
```

## Authentication

Login returns a Bearer token stored in `localStorage` under the key `access`. All API requests include it via the `Authorization` header. A 401/403 response clears the token and redirects to `/login`.

## API proxy pattern

All gateway device commands are sent as:

```
POST/GET/PUT/DELETE  /api/v1/{gwId}/proxy/{path}
```

Where `{path}` matches the gateway's REST API without the `/api/v1` prefix. Example:

```
GET /api/v1/d5b26259583f2416/proxy/summary
```
