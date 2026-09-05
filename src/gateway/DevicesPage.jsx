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
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import ListAltIcon from '@mui/icons-material/ListAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import { LoginContext } from '../App';
import { fetchGatewaySummary, refreshZwaveNetwork } from './gatewayApi';
import DeviceCard from './components/DeviceCard';
import DeviceModal from './DeviceModal';
import PairingPanel from './PairingPanel';
import SequencesPanel from './SequencesPanel';

const GROUP_DEFS = [
  { key: 'lock',       label: 'Locks',             match: (t) => t === 'lock' },
  { key: 'switch',     label: 'Switches & Dimmers', match: (t) => t === 'switch' },
  { key: 'thermostat', label: 'Thermostats',         match: (t) => t === 'thermostat' },
  { key: 'sensor',     label: 'Sensors',             match: () => true }, // catch-all
];

function buildGroups(devices) {
  const assigned = new Set();
  return GROUP_DEFS.reduce((acc, g) => {
    const members = devices.filter((d) => !assigned.has(d.id) && g.match(d.type));
    members.forEach((d) => assigned.add(d.id));
    if (members.length > 0) acc.push({ ...g, devices: members });
    return acc;
  }, []);
}

// view: null | 'pairing' | 'sequences'
export default function DevicesPage({ gwId }) {
  const [, setLoggedIn] = useContext(LoginContext);
  const queryClient = useQueryClient();
  const [modalDevice, setModalDevice] = useState(null);
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

  const devices = Object.values(data?.devices ?? {});
  const groups = buildGroups(devices);

  return (
    <Box>
      {/* Toolbar */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography component="h2" variant="h6">
          Devices · {data?.gw_id ?? gwId}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" startIcon={<ListAltIcon />} onClick={() => setView('sequences')}>
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
          <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => setView('pairing')}>
            Pair device
          </Button>
        </Stack>
      </Stack>

      {/* Grouped device cards */}
      {devices.length === 0 ? (
        <Typography color="text.secondary">No devices found on this gateway.</Typography>
      ) : (
        <Stack spacing={4}>
          {groups.map((group, i) => (
            <Box key={group.key}>
              {i > 0 && <Divider sx={{ mb: 3 }} />}
              <Typography variant="overline" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                {group.label}
              </Typography>
              <Grid container spacing={2}>
                {group.devices.map((device) => (
                  <Grid key={device.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <DeviceCard gwId={gwId} device={device} onOpenModal={setModalDevice} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Stack>
      )}

      {/* Device detail modal */}
      <DeviceModal
        gwId={gwId}
        device={modalDevice}
        onClose={() => setModalDevice(null)}
      />
    </Box>
  );
}
