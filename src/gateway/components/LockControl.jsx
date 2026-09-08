import * as React from 'react';
import { useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import Divider from '@mui/material/Divider';
import { LoginContext } from '../../App';
import { deviceGet, fetchDeviceSummary, setLockState } from '../gatewayApi';
import PincodesPanel from './PincodesPanel';
import EntityRow from './EntityRow';
import { lockVisual, batteryVisual } from './deviceVisuals';
import { isHAv1, getStatus, getBattery, hasAction } from '../deviceFormat';

export default function LockControl({ gwId, device }) {
  const [, setLoggedIn] = useContext(LoginContext);
  const queryClient = useQueryClient();
  const qKey = ['device', gwId, device.id, 'lock'];
  const hav1 = isHAv1(device);

  const { data: liveData, isPending, error } = useQuery({
    queryKey: qKey,
    queryFn: () => hav1
      ? fetchDeviceSummary(gwId, device.id, setLoggedIn)
      : deviceGet(gwId, device.id, 'lock', setLoggedIn),
  });

  const mutation = useMutation({
    mutationFn: (locked) => setLockState(gwId, device, locked, setLoggedIn),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qKey }),
  });

  const status = hav1 ? getStatus(liveData ?? device, 'lock') : (liveData?.value ?? device.status);
  const isLocked = status === 'locked';
  const lock = lockVisual(status);
  const deviceBattery = hav1 ? getBattery(liveData ?? device) : device.battery;
  const battery = batteryVisual(deviceBattery);
  const canLock = hasAction(device, 'lock');
  const canUnlock = hasAction(device, 'unlock');

  return (
    <Box>
      <Stack sx={{ mb: 2 }}>
        {isPending ? (
          <CircularProgress size={20} />
        ) : (
          <EntityRow icon={lock.icon} iconColor={lock.color} label="Lock" value={lock.label} />
        )}
        {battery && (
          <EntityRow icon={battery.icon} iconColor={battery.color} label="Battery" value={`${deviceBattery}%`} />
        )}
      </Stack>
      <Divider sx={{ mb: 2 }} />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}
      {mutation.error && <Alert severity="error" sx={{ mb: 2 }}>{mutation.error.message}</Alert>}

      <Stack direction="row" spacing={2}>
        <Tooltip title={canLock ? '' : 'Not supported by this device'}>
          <span>
            <Button
              variant="contained"
              startIcon={<LockIcon />}
              onClick={() => mutation.mutate(true)}
              disabled={mutation.isPending || isLocked || !canLock}
            >
              Lock
            </Button>
          </span>
        </Tooltip>
        <Tooltip title={canUnlock ? '' : 'Not supported by this device'}>
          <span>
            <Button
              variant="outlined"
              startIcon={<LockOpenIcon />}
              onClick={() => mutation.mutate(false)}
              disabled={mutation.isPending || status === 'unlocked' || !canUnlock}
            >
              Unlock
            </Button>
          </span>
        </Tooltip>
        {mutation.isPending && <CircularProgress size={24} sx={{ alignSelf: 'center' }} />}
      </Stack>

      <Divider sx={{ my: 3 }} />
      <PincodesPanel gwId={gwId} device={device} />
    </Box>
  );
}
