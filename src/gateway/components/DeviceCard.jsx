import * as React from 'react';
import { useState, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import { LoginContext } from '../../App';
import { deviceGet, devicePost } from '../gatewayApi';
import EntityRow from './EntityRow';
import { lockVisual, switchVisual, thermostatVisual } from './deviceVisuals';

const stopProp = (e) => e.stopPropagation();

// ── Lock (read-only — lock/unlock happens in the detail modal) ────────────────
function LockStatusRow({ device }) {
  const { icon, color, label } = lockVisual(device.status);
  return <EntityRow icon={icon} iconColor={color} label="Lock" value={label} />;
}

// ── Switch ──────────────────────────────────────────────────────────────────
function SwitchStatusRow({ gwId, device }) {
  const [, setLoggedIn] = useContext(LoginContext);
  const queryClient = useQueryClient();
  const [isOn, setIsOn] = useState(device.status === 'on');

  const mutation = useMutation({
    mutationFn: (value) => devicePost(gwId, device.id, 'switch', { value }, setLoggedIn),
    onSuccess: (_, value) => {
      setIsOn(value === 'on');
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
            onChange={(e) => mutation.mutate(e.target.checked ? 'on' : 'off')}
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
  const { data: state } = useQuery({
    queryKey: ['device', gwId, device.id, 'thermostat'],
    queryFn: () => deviceGet(gwId, device.id, 'thermostat', setLoggedIn),
    retry: false,
  });

  const mode = state?.mode ?? null;
  const { icon, color } = thermostatVisual(mode);

  const setpoints = [
    state?.heat != null ? `${state.heat}°` : null,
    state?.cool != null ? `${state.cool}°` : null,
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

// ── Sensor (arm/disarm stub) ──────────────────────────────────────────────────
function SensorQuickActions({ device }) {
  return (
    <Stack spacing={1}>
      {device.status && (
        <Chip label={device.status} size="small" sx={{ alignSelf: 'flex-start' }} />
      )}
      <Stack direction="row" spacing={1} onClick={stopProp}>
        <Tooltip title="Coming soon">
          <span>
            <Button size="small" variant="outlined" color="warning" disabled>Arm</Button>
          </span>
        </Tooltip>
        <Tooltip title="Coming soon">
          <span>
            <Button size="small" variant="outlined" disabled>Disarm</Button>
          </span>
        </Tooltip>
      </Stack>
    </Stack>
  );
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
function StatusRow({ gwId, device }) {
  switch (device.type) {
    case 'lock':       return <LockStatusRow device={device} />;
    case 'switch':     return <SwitchStatusRow gwId={gwId} device={device} />;
    case 'thermostat': return <ThermostatStatusRow gwId={gwId} device={device} />;
    default:           return <SensorQuickActions device={device} />;
  }
}

// ── Card ──────────────────────────────────────────────────────────────────────
export default function DeviceCard({ gwId, device, onOpenModal }) {
  const displayName = device.name || device.node || device.id;

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
          {device.battery != null && (
            <Chip
              label={`${device.battery}%`}
              size="small"
              variant="outlined"
              color={device.battery < 20 ? 'error' : device.battery < 50 ? 'warning' : 'default'}
            />
          )}
        </Stack>
        <StatusRow gwId={gwId} device={device} />
      </CardContent>
    </Card>
  );
}
