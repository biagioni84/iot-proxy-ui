import * as React from 'react';
import { useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import Divider from '@mui/material/Divider';
import { LoginContext } from '../../App';
import { deviceGet, devicePost } from '../gatewayApi';
import PincodesPanel from './PincodesPanel';
import EntityRow from './EntityRow';
import { lockVisual, batteryVisual } from './deviceVisuals';

export default function LockControl({ gwId, device }) {
  const [, setLoggedIn] = useContext(LoginContext);
  const queryClient = useQueryClient();
  const qKey = ['device', gwId, device.id, 'lock'];

  const { data: lockState, isPending, error } = useQuery({
    queryKey: qKey,
    queryFn: () => deviceGet(gwId, device.id, 'lock', setLoggedIn),
  });

  const mutation = useMutation({
    mutationFn: (value) => devicePost(gwId, device.id, 'lock', { value }, setLoggedIn),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qKey }),
  });

  const status = lockState?.value ?? device.status;
  const isLocked = status === 'locked';
  const lock = lockVisual(status);
  const battery = batteryVisual(device.battery);

  return (
    <Box>
      <Stack sx={{ mb: 2 }}>
        {isPending ? (
          <CircularProgress size={20} />
        ) : (
          <EntityRow icon={lock.icon} iconColor={lock.color} label="Lock" value={lock.label} />
        )}
        {battery && (
          <EntityRow icon={battery.icon} iconColor={battery.color} label="Battery" value={`${device.battery}%`} />
        )}
      </Stack>
      <Divider sx={{ mb: 2 }} />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}
      {mutation.error && <Alert severity="error" sx={{ mb: 2 }}>{mutation.error.message}</Alert>}

      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          startIcon={<LockIcon />}
          onClick={() => mutation.mutate('lock')}
          disabled={mutation.isPending || isLocked}
        >
          Lock
        </Button>
        <Button
          variant="outlined"
          startIcon={<LockOpenIcon />}
          onClick={() => mutation.mutate('unlock')}
          disabled={mutation.isPending || status === 'unlocked'}
        >
          Unlock
        </Button>
        {mutation.isPending && <CircularProgress size={24} sx={{ alignSelf: 'center' }} />}
      </Stack>

      <Divider sx={{ my: 3 }} />
      <PincodesPanel gwId={gwId} device={device} />
    </Box>
  );
}
