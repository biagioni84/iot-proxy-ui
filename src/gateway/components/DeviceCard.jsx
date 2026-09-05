import * as React from 'react';
import { useState, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { LoginContext } from '../../App';
import { deviceGet, devicePost } from '../gatewayApi';

const stopProp = (e) => e.stopPropagation();

// ── Lock ─────────────────────────────────────────────────────────────────────
function LockQuickActions({ gwId, device }) {
  const [, setLoggedIn] = useContext(LoginContext);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(device.status);

  const mutation = useMutation({
    mutationFn: (value) => devicePost(gwId, device.id, 'lock', { value }, setLoggedIn),
    onSuccess: (_, value) => {
      setStatus(value === 'lock' ? 'locked' : 'unlocked');
      queryClient.invalidateQueries({ queryKey: ['gatewaySummary', gwId] });
    },
  });

  const isLocked = status === 'locked';

  return (
    <Stack spacing={1} onClick={stopProp}>
      <Chip
        icon={isLocked ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
        label={status ?? 'unknown'}
        color={isLocked ? 'success' : 'default'}
        size="small"
        sx={{ alignSelf: 'flex-start' }}
      />
      <Stack direction="row" spacing={1} alignItems="center">
        <Button size="small" variant="contained"
          startIcon={<LockIcon />}
          onClick={() => mutation.mutate('lock')}
          disabled={mutation.isPending || isLocked}
        >
          Lock
        </Button>
        <Button size="small" variant="outlined"
          startIcon={<LockOpenIcon />}
          onClick={() => mutation.mutate('unlock')}
          disabled={mutation.isPending || status === 'unlocked'}
        >
          Unlock
        </Button>
        {mutation.isPending && <CircularProgress size={16} />}
      </Stack>
    </Stack>
  );
}

// ── Switch ────────────────────────────────────────────────────────────────────
function SwitchQuickActions({ gwId, device }) {
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

  return (
    <Stack direction="row" alignItems="center" spacing={1} onClick={stopProp}>
      <FormControlLabel
        control={
          <Switch
            checked={isOn}
            onChange={(e) => mutation.mutate(e.target.checked ? 'on' : 'off')}
            disabled={mutation.isPending}
            size="small"
          />
        }
        label={isOn ? 'On' : 'Off'}
        sx={{ m: 0 }}
      />
      {mutation.isPending && <CircularProgress size={16} />}
    </Stack>
  );
}

// ── Thermostat ────────────────────────────────────────────────────────────────
const THERMO_MODES = ['heat', 'cool', 'auto', 'off'];

function ThermostatQuickActions({ gwId, device }) {
  const [, setLoggedIn] = useContext(LoginContext);
  const queryClient = useQueryClient();
  const qKey = ['device', gwId, device.id, 'thermostat'];

  const { data: state } = useQuery({
    queryKey: qKey,
    queryFn: () => deviceGet(gwId, device.id, 'thermostat', setLoggedIn),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (body) => devicePost(gwId, device.id, 'thermostat', body, setLoggedIn),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qKey }),
  });

  const mode = state?.mode ?? null;

  return (
    <Stack spacing={1} onClick={stopProp}>
      <Stack direction="row" spacing={0.5}>
        {state?.heat != null && (
          <Chip label={`↑ ${state.heat}°`} size="small" color="error" variant="outlined" />
        )}
        {state?.cool != null && (
          <Chip label={`↓ ${state.cool}°`} size="small" color="info" variant="outlined" />
        )}
        {state == null && (
          <Chip label="—" size="small" variant="outlined" />
        )}
      </Stack>
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(_, v) => v && mutation.mutate({ mode: v })}
        size="small"
        disabled={mutation.isPending}
      >
        {THERMO_MODES.map((m) => (
          <ToggleButton key={m} value={m} sx={{ px: 1, py: 0.25, fontSize: 11, minWidth: 42 }}>
            {m}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
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
function QuickActions({ gwId, device }) {
  switch (device.type) {
    case 'lock':       return <LockQuickActions gwId={gwId} device={device} />;
    case 'switch':     return <SwitchQuickActions gwId={gwId} device={device} />;
    case 'thermostat': return <ThermostatQuickActions gwId={gwId} device={device} />;
    default:           return <SensorQuickActions device={device} />;
  }
}

// ── Card ──────────────────────────────────────────────────────────────────────
export default function DeviceCard({ gwId, device, onOpenModal }) {
  const displayName = device.name || device.node || device.id;

  return (
    <Card
      variant="outlined"
      onClick={() => onOpenModal(device)}
      sx={{ cursor: 'pointer', height: '100%', '&:hover': { boxShadow: 3 } }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
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
        <QuickActions gwId={gwId} device={device} />
      </CardContent>
    </Card>
  );
}
