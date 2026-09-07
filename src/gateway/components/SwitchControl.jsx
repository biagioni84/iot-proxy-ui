import * as React from 'react';
import { useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import { LoginContext } from '../../App';
import { deviceGet, devicePost } from '../gatewayApi';
import EntityRow from './EntityRow';
import { switchVisual, batteryVisual } from './deviceVisuals';

function DimmerSection({ gwId, device, setLoggedIn }) {
  const queryClient = useQueryClient();
  const qKey = ['device', gwId, device.id, 'level'];

  const { data: levelState, isPending, error } = useQuery({
    queryKey: qKey,
    queryFn: () => deviceGet(gwId, device.id, 'level', setLoggedIn),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (value) => devicePost(gwId, device.id, 'level', { value }, setLoggedIn),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qKey }),
  });

  // If endpoint doesn't exist, don't render
  if (error) return null;

  return (
    <Box sx={{ mt: 3 }}>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="subtitle2" gutterBottom>
        Brightness level
      </Typography>
      {isPending ? (
        <CircularProgress size={20} />
      ) : (
        <Box sx={{ px: 1 }}>
          <Slider
            min={0}
            max={99}
            value={levelState?.value ?? 0}
            onChange={(_, val) => mutation.mutate(val)}
            valueLabelDisplay="auto"
            disabled={mutation.isPending}
          />
        </Box>
      )}
    </Box>
  );
}

export default function SwitchControl({ gwId, device }) {
  const [, setLoggedIn] = useContext(LoginContext);
  const queryClient = useQueryClient();
  const qKey = ['device', gwId, device.id, 'switch'];

  const { data: switchState, isPending, error } = useQuery({
    queryKey: qKey,
    queryFn: () => deviceGet(gwId, device.id, 'switch', setLoggedIn),
  });

  const mutation = useMutation({
    mutationFn: (value) => devicePost(gwId, device.id, 'switch', { value }, setLoggedIn),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qKey }),
  });

  const isOn = (switchState?.value ?? device.status) === 'on';
  const sw = switchVisual(isOn);
  const battery = batteryVisual(device.battery);

  return (
    <Box>
      <Stack sx={{ mb: 2 }}>
        {isPending ? (
          <CircularProgress size={20} />
        ) : (
          <EntityRow
            icon={sw.icon}
            iconColor={sw.color}
            label="Switch"
            control={
              mutation.isPending ? (
                <CircularProgress size={20} />
              ) : (
                <Switch
                  checked={isOn}
                  onChange={(e) => mutation.mutate(e.target.checked ? 'on' : 'off')}
                />
              )
            }
          />
        )}
        {battery && (
          <EntityRow icon={battery.icon} iconColor={battery.color} label="Battery" value={`${device.battery}%`} />
        )}
      </Stack>

      {error && <Alert severity="error">{error.message}</Alert>}
      {mutation.error && <Alert severity="error">{mutation.error.message}</Alert>}

      {device.protocol === 'zwave' && (
        <DimmerSection gwId={gwId} device={device} setLoggedIn={setLoggedIn} />
      )}
    </Box>
  );
}
