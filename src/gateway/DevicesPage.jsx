import * as React from 'react';
import { useState, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import ListAltIcon from '@mui/icons-material/ListAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import { LoginContext } from '../App';
import { fetchGatewaySummary, refreshZwaveNetwork } from './gatewayApi';
import DeviceCard from './components/DeviceCard';
import DeviceDetail from './DeviceDetail';
import PairingPanel from './PairingPanel';
import SequencesPanel from './SequencesPanel';

// view: null | 'pairing' | 'sequences'
export default function DevicesPage({ gwId }) {
  const [, setLoggedIn] = useContext(LoginContext);
  const queryClient = useQueryClient();
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [view, setView] = useState(null);

  const refreshMutation = useMutation({
    mutationFn: () => refreshZwaveNetwork(gwId, setLoggedIn),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gatewaySummary', gwId] }),
  });

  const { isPending, error, data } = useQuery({
    queryKey: ['gatewaySummary', gwId],
    queryFn: () => fetchGatewaySummary(gwId, setLoggedIn),
    enabled: !!gwId,
  });

  if (isPending) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">Failed to load devices: {error.message}</Alert>;
  }

  if (view === 'pairing') {
    return <PairingPanel gwId={gwId} onBack={() => setView(null)} />;
  }

  if (view === 'sequences') {
    return <SequencesPanel gwId={gwId} onBack={() => setView(null)} />;
  }

  if (selectedDevice) {
    return (
      <DeviceDetail
        gwId={gwId}
        device={selectedDevice}
        onBack={() => setSelectedDevice(null)}
      />
    );
  }

  const devices = Object.values(data?.devices ?? {});

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography component="h2" variant="h6">
          Devices · {data?.gw_id ?? gwId}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ListAltIcon />}
            onClick={() => setView('sequences')}
          >
            Sequences
          </Button>
          <Tooltip title="Refresh Z-Wave node list">
            <Button
              variant="outlined"
              size="small"
              startIcon={refreshMutation.isPending ? <CircularProgress size={14} /> : <RefreshIcon />}
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
            >
              Refresh
            </Button>
          </Tooltip>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setView('pairing')}
          >
            Pair device
          </Button>
        </Stack>
      </Stack>

      {devices.length === 0 ? (
        <Typography color="text.secondary">No devices found on this gateway.</Typography>
      ) : (
        <Grid container spacing={2}>
          {devices.map((device) => (
            <Grid key={device.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <DeviceCard device={device} onClick={setSelectedDevice} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
