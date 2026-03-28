import * as React from 'react';
import { useState, useContext, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BluetoothSearchingIcon from '@mui/icons-material/BluetoothSearching';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { LoginContext } from '../App';
import {
  startInclusion, stopInclusion,
  startExclusion, stopExclusion,
} from './gatewayApi';

const INCLUSION_TIMEOUT_S = 60;

function InclusionSection({ gwId }) {
  const [, setLoggedIn] = useContext(LoginContext);
  const [protocol, setProtocol] = useState('zwave');
  const [active, setActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(INCLUSION_TIMEOUT_S);
  const timerRef = useRef(null);

  const startMutation = useMutation({
    mutationFn: () => startInclusion(gwId, protocol, setLoggedIn),
    onSuccess: () => {
      setActive(true);
      setSecondsLeft(INCLUSION_TIMEOUT_S);
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => stopInclusion(gwId, protocol, setLoggedIn),
    onSuccess: () => setActive(false),
  });

  // Countdown + auto-stop
  useEffect(() => {
    if (!active) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          stopMutation.mutate();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [active]);

  const handleStop = () => {
    clearInterval(timerRef.current);
    stopMutation.mutate();
  };

  const progress = ((INCLUSION_TIMEOUT_S - secondsLeft) / INCLUSION_TIMEOUT_S) * 100;

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Include (pair new device)
      </Typography>

      <ToggleButtonGroup
        value={protocol}
        exclusive
        onChange={(_, v) => v && setProtocol(v)}
        size="small"
        disabled={active || startMutation.isPending}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="zwave">Z-Wave</ToggleButton>
        <ToggleButton value="zigbee">Zigbee</ToggleButton>
      </ToggleButtonGroup>

      {startMutation.error && <Alert severity="error" sx={{ mb: 2 }}>{startMutation.error.message}</Alert>}
      {stopMutation.error && <Alert severity="error" sx={{ mb: 2 }}>{stopMutation.error.message}</Alert>}

      {active ? (
        <Box>
          <Alert severity="info" icon={<BluetoothSearchingIcon />} sx={{ mb: 2 }}>
            Put the device in pairing mode now — {secondsLeft}s remaining
          </Alert>
          <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />
          <Button
            variant="outlined"
            color="error"
            onClick={handleStop}
            disabled={stopMutation.isPending}
          >
            Stop
          </Button>
        </Box>
      ) : (
        <Button
          variant="contained"
          startIcon={startMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <BluetoothSearchingIcon />}
          onClick={() => startMutation.mutate()}
          disabled={startMutation.isPending}
        >
          Start pairing
        </Button>
      )}
    </Box>
  );
}

function ExclusionSection({ gwId }) {
  const [, setLoggedIn] = useContext(LoginContext);
  const [active, setActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(INCLUSION_TIMEOUT_S);
  const timerRef = useRef(null);

  const startMutation = useMutation({
    mutationFn: () => startExclusion(gwId, setLoggedIn),
    onSuccess: () => {
      setActive(true);
      setSecondsLeft(INCLUSION_TIMEOUT_S);
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => stopExclusion(gwId, setLoggedIn),
    onSuccess: () => setActive(false),
  });

  useEffect(() => {
    if (!active) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          stopMutation.mutate();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [active]);

  const handleStop = () => {
    clearInterval(timerRef.current);
    stopMutation.mutate();
  };

  const progress = ((INCLUSION_TIMEOUT_S - secondsLeft) / INCLUSION_TIMEOUT_S) * 100;

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Exclude (Z-Wave only)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Put the device in exclusion mode to remove it from the network.
      </Typography>

      {startMutation.error && <Alert severity="error" sx={{ mb: 2 }}>{startMutation.error.message}</Alert>}
      {stopMutation.error && <Alert severity="error" sx={{ mb: 2 }}>{stopMutation.error.message}</Alert>}

      {active ? (
        <Box>
          <Alert severity="warning" icon={<LinkOffIcon />} sx={{ mb: 2 }}>
            Put the device in exclusion mode now — {secondsLeft}s remaining
          </Alert>
          <LinearProgress variant="determinate" value={progress} color="warning" sx={{ mb: 2 }} />
          <Button
            variant="outlined"
            color="error"
            onClick={handleStop}
            disabled={stopMutation.isPending}
          >
            Stop
          </Button>
        </Box>
      ) : (
        <Button
          variant="outlined"
          color="warning"
          startIcon={startMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <LinkOffIcon />}
          onClick={() => startMutation.mutate()}
          disabled={startMutation.isPending}
        >
          Start exclusion
        </Button>
      )}
    </Box>
  );
}

export default function PairingPanel({ gwId, onBack }) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <IconButton onClick={onBack} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">Pair / Unpair Devices</Typography>
      </Stack>

      <InclusionSection gwId={gwId} />

      <Divider sx={{ my: 4 }} />

      <ExclusionSection gwId={gwId} />
    </Box>
  );
}
