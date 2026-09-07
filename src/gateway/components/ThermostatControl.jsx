import * as React from 'react';
import { useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { LoginContext } from '../../App';
import { deviceGet, devicePost } from '../gatewayApi';
import EntityRow from './EntityRow';
import { thermostatVisual } from './deviceVisuals';

const MODES = ['heat', 'cool', 'auto', 'off'];

export default function ThermostatControl({ gwId, device }) {
  const [, setLoggedIn] = useContext(LoginContext);
  const queryClient = useQueryClient();
  const qKey = ['device', gwId, device.id, 'thermostat'];

  const { data: state, isPending, error } = useQuery({
    queryKey: qKey,
    queryFn: () => deviceGet(gwId, device.id, 'thermostat', setLoggedIn),
  });

  const [heat, setHeat] = useState('');
  const [cool, setCool] = useState('');

  useEffect(() => {
    if (state) {
      setHeat(state.heat ?? '');
      setCool(state.cool ?? '');
    }
  }, [state]);

  const mutation = useMutation({
    mutationFn: (body) => devicePost(gwId, device.id, 'thermostat', body, setLoggedIn),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qKey }),
  });

  if (isPending) return <CircularProgress size={24} />;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  const thermo = thermostatVisual(state?.mode);
  const setpoints = [
    state?.heat != null ? `Heat ${state.heat}°` : null,
    state?.cool != null ? `Cool ${state.cool}°` : null,
  ].filter(Boolean).join(' · ');

  return (
    <Box>
      <Stack sx={{ mb: 3 }}>
        <EntityRow
          icon={thermo.icon}
          iconColor={thermo.color}
          label="Thermostat"
          value={state?.mode ? state.mode.charAt(0).toUpperCase() + state.mode.slice(1) : '—'}
          subtitle={setpoints || undefined}
        />
      </Stack>

      <FormControl size="small" sx={{ mb: 3, minWidth: 160 }}>
        <InputLabel>Mode</InputLabel>
        <Select
          value={state?.mode ?? ''}
          label="Mode"
          onChange={(e) => mutation.mutate({ mode: e.target.value })}
          disabled={mutation.isPending}
        >
          {MODES.map((m) => (
            <MenuItem key={m} value={m}>{m}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Stack direction="row" spacing={2} alignItems="flex-end">
        <TextField
          label="Heat setpoint (°C)"
          type="number"
          size="small"
          value={heat}
          onChange={(e) => setHeat(e.target.value)}
          inputProps={{ step: 0.5 }}
          sx={{ width: 160 }}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={() => mutation.mutate({ heat: parseFloat(heat) })}
          disabled={mutation.isPending || heat === ''}
        >
          Set
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} alignItems="flex-end" sx={{ mt: 2 }}>
        <TextField
          label="Cool setpoint (°C)"
          type="number"
          size="small"
          value={cool}
          onChange={(e) => setCool(e.target.value)}
          inputProps={{ step: 0.5 }}
          sx={{ width: 160 }}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={() => mutation.mutate({ cool: parseFloat(cool) })}
          disabled={mutation.isPending || cool === ''}
        >
          Set
        </Button>
      </Stack>

      {mutation.error && <Alert severity="error" sx={{ mt: 2 }}>{mutation.error.message}</Alert>}
      {mutation.isPending && <CircularProgress size={20} sx={{ mt: 2 }} />}
    </Box>
  );
}
