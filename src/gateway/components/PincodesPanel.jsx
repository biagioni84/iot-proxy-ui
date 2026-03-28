import * as React from 'react';
import { useState, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { LoginContext } from '../../App';
import { fetchPincodes, setPincode, deletePincode } from '../gatewayApi';

const TOTAL_SLOTS = 10;

export default function PincodesPanel({ gwId, device }) {
  const [, setLoggedIn] = useContext(LoginContext);
  const queryClient = useQueryClient();
  const qKey = ['pincodes', gwId, device.id];

  const [editingSlot, setEditingSlot] = useState(null);
  const [editValue, setEditValue] = useState('');

  const { data: pincodes = {}, isPending, error } = useQuery({
    queryKey: qKey,
    queryFn: () => fetchPincodes(gwId, device.id, setLoggedIn),
  });

  const setMutation = useMutation({
    mutationFn: ({ slot, code }) => setPincode(gwId, device.id, slot, code, setLoggedIn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qKey });
      setEditingSlot(null);
      setEditValue('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (slot) => deletePincode(gwId, device.id, slot, setLoggedIn),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qKey }),
  });

  const startEdit = (slot) => {
    setEditingSlot(slot);
    setEditValue(pincodes[slot] ?? '');
  };

  const cancelEdit = () => {
    setEditingSlot(null);
    setEditValue('');
  };

  const confirmEdit = (slot) => {
    if (editValue.trim()) {
      setMutation.mutate({ slot, code: editValue.trim() });
    }
  };

  const isBusy = (slot) =>
    (setMutation.isPending && editingSlot === slot) ||
    (deleteMutation.isPending && deleteMutation.variables === slot);

  if (isPending) return <CircularProgress size={20} />;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => i + 1);

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Pincodes
      </Typography>

      {(setMutation.error || deleteMutation.error) && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {(setMutation.error || deleteMutation.error).message}
        </Alert>
      )}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell width={60}>Slot</TableCell>
            <TableCell>Code</TableCell>
            <TableCell align="right" width={120}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {slots.map((slot) => {
            const code = pincodes[String(slot)];
            const isEditing = editingSlot === slot;
            const busy = isBusy(slot);

            return (
              <TableRow key={slot}>
                <TableCell>{slot}</TableCell>
                <TableCell>
                  {isEditing ? (
                    <TextField
                      size="small"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmEdit(slot);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      placeholder="Enter code"
                      autoFocus
                      inputProps={{ maxLength: 20 }}
                      sx={{ width: 140 }}
                    />
                  ) : (
                    <Typography variant="body2" color={code ? 'text.primary' : 'text.disabled'}>
                      {code ? '••••' : '—'}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  {busy ? (
                    <CircularProgress size={18} />
                  ) : isEditing ? (
                    <>
                      <Tooltip title="Confirm">
                        <IconButton size="small" onClick={() => confirmEdit(slot)} disabled={!editValue.trim()}>
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancel">
                        <IconButton size="small" onClick={cancelEdit}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <Tooltip title={code ? 'Change' : 'Set'}>
                        <IconButton size="small" onClick={() => startEdit(slot)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {code && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => deleteMutation.mutate(slot)}
                            disabled={deleteMutation.isPending}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}
