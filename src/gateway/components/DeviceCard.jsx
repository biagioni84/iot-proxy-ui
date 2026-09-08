import * as React from 'react';
import { useState, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import { LoginContext } from '../../App';
import { deviceGet, setSwitchState } from '../gatewayApi';
import EntityRow from './EntityRow';
import EntityGroup from './EntityGroup';
import { lockVisual, switchVisual, thermostatVisual } from './deviceVisuals';
import { isHAv1, getStatus, getBattery, isMultiEntity } from '../deviceFormat';

// ── Lock (read-only — lock/unlock happens in the detail modal) ────────────────
function LockStatusRow({ device }) {
  const status = isHAv1(device) ? getStatus(device, 'lock') : device.status;
  const { icon, color, label } = lockVisual(status);
  return <EntityRow icon={icon} iconColor={color} label="Lock" value={label} />;
}

// ── Switch ──────────────────────────────────────────────────────────────────
function SwitchStatusRow({ gwId, device }) {
  const [, setLoggedIn] = useContext(LoginContext);
  const queryClient = useQueryClient();
  const initialStatus = isHAv1(device) ? getStatus(device, 'switch') : device.status;
  const [isOn, setIsOn] = useState(initialStatus === 'on');

  const mutation = useMutation({
    mutationFn: (on) => setSwitchState(gwId, device, on, setLoggedIn),
    onSuccess: (_, on) => {
      setIsOn(on);
      queryClient.invalidateQueries({ queryKey: ['gatewaySummary', gwId] });
    },
  });

  const { icon, color } = switchVisual(isOn);

  return (
    <EntityRow
      icon={icon}
      iconColor={color}
      label="Switch"
      control={
        mutation.isPending ? (
          <CircularProgress size={18} />
        ) : (
          <Switch
            checked={isOn}
            onChange={(e) => mutation.mutate(e.target.checked)}
            size="small"
          />
        )
      }
    />
  );
}

// ── Thermostat (read-only — mode/setpoints change in the detail modal) ────────
function ThermostatStatusRow({ gwId, device }) {
  const [, setLoggedIn] = useContext(LoginContext);
  const hav1 = isHAv1(device);

  const { data: legacyState } = useQuery({
    queryKey: ['device', gwId, device.id, 'thermostat'],
    queryFn: () => deviceGet(gwId, device.id, 'thermostat', setLoggedIn),
    retry: false,
    enabled: !hav1,
  });

  const mode = hav1 ? getStatus(device, 'climate') : legacyState?.mode ?? null;
  const heat = hav1 ? getStatus(device, 'heat') ?? getStatus(device, 'temperature') : legacyState?.heat;
  const cool = hav1 ? getStatus(device, 'cool') : legacyState?.cool;
  const { icon, color } = thermostatVisual(mode);

  const setpoints = [
    heat != null ? `${heat}°` : null,
    cool != null ? `${cool}°` : null,
  ].filter(Boolean).join(' / ');

  return (
    <EntityRow
      icon={icon}
      iconColor={color}
      label="Thermostat"
      value={mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : '—'}
      subtitle={setpoints || undefined}
    />
  );
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
// A HAv1 device grouping more than one entity of the same kind (e.g. two
// switches on one physical device) falls through to the generic per-entity
// renderer regardless of `type`, since the single-widget components below
// only ever address the first instance.
function StatusRow({ gwId, device }) {
  if (isMultiEntity(device)) {
    return <EntityGroup gwId={gwId} device={device} maxRows={4} />;
  }
  switch (device.type) {
    case 'lock':       return <LockStatusRow device={device} />;
    case 'switch':     return <SwitchStatusRow gwId={gwId} device={device} />;
    case 'thermostat': return <ThermostatStatusRow gwId={gwId} device={device} />;
    default:           return <EntityGroup gwId={gwId} device={device} maxRows={4} />;
  }
}

// ── Card ──────────────────────────────────────────────────────────────────────
export default function DeviceCard({ gwId, device, onOpenModal }) {
  const displayName = device.name || device.node || device.id;
  const battery = getBattery(device);

  return (
    <Card
      onClick={() => onOpenModal(device)}
      sx={{
        cursor: 'pointer',
        height: '100%',
        borderRadius: 3,
        boxShadow: 1,
        '&:hover': { boxShadow: 4 },
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
          <Typography variant="subtitle2" noWrap sx={{ maxWidth: '75%' }}>
            {displayName}
          </Typography>
          {battery != null && (
            <Chip
              label={`${battery}%`}
              size="small"
              variant="outlined"
              color={battery < 20 ? 'error' : battery < 50 ? 'warning' : 'default'}
            />
          )}
        </Stack>
        <StatusRow gwId={gwId} device={device} />
      </CardContent>
    </Card>
  );
}
