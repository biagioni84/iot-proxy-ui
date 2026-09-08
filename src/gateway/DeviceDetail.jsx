import * as React from 'react';
import { useState, useContext } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import RefreshIcon from '@mui/icons-material/Refresh';
import { LoginContext } from '../App';
import { renameDevice, deleteDevice, reinterviewDevice } from './gatewayApi';
import { isMultiEntity } from './deviceFormat';
import LockControl from './components/LockControl';
import SwitchControl from './components/SwitchControl';
import ThermostatControl from './components/ThermostatControl';
import EntityGroup from './components/EntityGroup';

function Controls({ gwId, device }) {
  // A HAv1 device grouping more than one entity of the same kind falls
  // through to the generic per-entity list — the single-widget controls
  // below only ever address the first instance.
  if (isMultiEntity(device)) {
    return <EntityGroup gwId={gwId} device={device} />;
  }
  switch (device.type) {
    case 'lock':
      return <LockControl gwId={gwId} device={device} />;
    case 'switch':
      return <SwitchControl gwId={gwId} device={device} />;
    case 'thermostat':
      return <ThermostatControl gwId={gwId} device={device} />;
    default:
      return <EntityGroup gwId={gwId} device={device} />;
  }
}

export default function DeviceDetail({ gwId, device, onClose }) {
  const [, setLoggedIn] = useContext(LoginContext);
  const queryClient = useQueryClient();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [localName, setLocalName] = useState(device.name);
  const [showDelete, setShowDelete] = useState(false);

  const displayName = localName || device.node || device.id;

  const renameMutation = useMutation({
    mutationFn: (name) => renameDevice(gwId, device.id, name, setLoggedIn),
    onSuccess: (_, name) => {
      setLocalName(name);
      setEditingName(false);
      queryClient.invalidateQueries({ queryKey: ['gatewaySummary', gwId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDevice(gwId, device.id, setLoggedIn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gatewaySummary', gwId] });
      onClose();
    },
  });

  const reinterviewMutation = useMutation({
    mutationFn: () => reinterviewDevice(gwId, device.node, setLoggedIn),
  });

  const startRename = () => {
    setNameValue(localName ?? '');
    setEditingName(true);
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        {editingName ? (
          <>
            <TextField
              size="small"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nameValue.trim()) renameMutation.mutate(nameValue.trim());
                if (e.key === 'Escape') setEditingName(false);
              }}
              autoFocus
              sx={{ flexGrow: 1 }}
              disabled={renameMutation.isPending}
            />
            <Tooltip title="Confirm">
              <IconButton
                size="small"
                onClick={() => renameMutation.mutate(nameValue.trim())}
                disabled={!nameValue.trim() || renameMutation.isPending}
              >
                {renameMutation.isPending ? <CircularProgress size={16} /> : <CheckIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Cancel">
              <IconButton size="small" onClick={() => setEditingName(false)}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>{displayName}</Typography>
            <Tooltip title="Rename">
              <IconButton size="small" onClick={startRename}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete device">
              <IconButton size="small" color="error" onClick={() => setShowDelete(true)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton size="small" onClick={onClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Stack>

      {renameMutation.error && (
        <Alert severity="error" sx={{ mb: 1 }}>{renameMutation.error.message}</Alert>
      )}

      {/* Meta chips */}
      <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
        <Chip label={device.type} size="small" variant="outlined" />
        <Chip label={device.protocol} size="small" variant="outlined" />
        {device.manufacturer && (
          <Chip label={device.manufacturer} size="small" variant="outlined" />
        )}
      </Stack>

      {device.modelId && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          {device.modelId}
        </Typography>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Controls */}
      <Controls gwId={gwId} device={device} />

      {/* Z-Wave operations */}
      {device.protocol === 'zwave' && (
        <>
          <Divider sx={{ my: 3 }} />
          <Button
            variant="text"
            size="small"
            startIcon={reinterviewMutation.isPending ? <CircularProgress size={14} /> : <RefreshIcon />}
            onClick={() => reinterviewMutation.mutate()}
            disabled={reinterviewMutation.isPending}
          >
            Re-interview device
          </Button>
          {reinterviewMutation.error && (
            <Alert severity="error" sx={{ mt: 1 }}>{reinterviewMutation.error.message}</Alert>
          )}
          {reinterviewMutation.isSuccess && (
            <Alert severity="success" sx={{ mt: 1 }}>Re-interview started.</Alert>
          )}
        </>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={showDelete} onClose={() => setShowDelete(false)}>
        <DialogTitle>Delete device?</DialogTitle>
        <DialogContent>
          <Typography>
            Remove <strong>{displayName}</strong> from the gateway? This will unpair the device.
          </Typography>
          {deleteMutation.error && (
            <Alert severity="error" sx={{ mt: 2 }}>{deleteMutation.error.message}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <CircularProgress size={18} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
