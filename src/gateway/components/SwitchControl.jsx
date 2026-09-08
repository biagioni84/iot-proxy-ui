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
import { deviceGet, fetchDeviceSummary, setSwitchState, setDimmerLevel } from '../gatewayApi';
import EntityRow from './EntityRow';
import { switchVisual, batteryVisual } from './deviceVisuals';
import { isHAv1, getStatus, getBattery, hasAction } from '../deviceFormat';

function DimmerSection({ gwId, device, setLoggedIn }) {
  const queryClient = useQueryClient();
  const qKey = ['device', gwId, device.id, 'level'];
  const hav1 = isHAv1(device);

  const { data: liveData, isPending, error } = useQuery({
    queryKey: qKey,
    queryFn: () => hav1
      ? fetchDeviceSummary(gwId, device.id, setLoggedIn)
      : deviceGet(gwId, device.id, 'level', setLoggedIn),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (value) => setDimmerLevel(gwId, device, value, setLoggedIn),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qKey }),
  });

  // Legacy: if the /level endpoint doesn't exist for this device, don't render.
  if (!hav1 && error) return null;

  const level = hav1
    ? getStatus(liveData ?? device, 'level') ?? getStatus(liveData ?? device, 'brightness')
    : liveData?.value;

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
            value={level ?? 0}
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
  const hav1 = isHAv1(device);

  const { data: liveData, isPending, error } = useQuery({
    queryKey: qKey,
    queryFn: () => hav1
      ? fetchDeviceSummary(gwId, device.id, setLoggedIn)
      : deviceGet(gwId, device.id, 'switch', setLoggedIn),
  });

  const mutation = useMutation({
    mutationFn: (on) => setSwitchState(gwId, device, on, setLoggedIn),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qKey }),
  });

  const isOn = hav1
    ? getStatus(liveData ?? device, 'switch') === 'on'
    : (liveData?.value ?? device.status) === 'on';
  const sw = switchVisual(isOn);
  const deviceBattery = hav1 ? getBattery(liveData ?? device) : device.battery;
  const battery = batteryVisual(deviceBattery);
  const showDimmer = hav1 ? hasAction(device, 'set_level') : device.protocol === 'zwave';

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
                  onChange={(e) => mutation.mutate(e.target.checked)}
                />
              )
            }
          />
        )}
        {battery && (
          <EntityRow icon={battery.icon} iconColor={battery.color} label="Battery" value={`${deviceBattery}%`} />
        )}
      </Stack>

      {error && <Alert severity="error">{error.message}</Alert>}
      {mutation.error && <Alert severity="error">{mutation.error.message}</Alert>}

      {showDimmer && (
        <DimmerSection gwId={gwId} device={device} setLoggedIn={setLoggedIn} />
      )}
    </Box>
  );
}
