import * as React from 'react';
import { useState, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { LoginContext } from '../App';
import { listSequences, createSequence, updateSequence, deleteSequence } from './gatewayApi';

const EMPTY_FORM = { name: '', steps: '[]' };

function isValidJson(str) {
  try { JSON.parse(str); return true; } catch { return false; }
}

function SequenceDialog({ open, initial, onClose, onSave, saving, saveError }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);

  // Reset when dialog opens
  React.useEffect(() => {
    if (open) setForm(initial ?? EMPTY_FORM);
  }, [open]);

  const isEdit = !!initial?.id;
  const valid = form.name.trim() && isValidJson(form.steps);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Edit sequence' : 'New sequence'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
            autoFocus
          />
          <TextField
            label="Steps (JSON)"
            value={form.steps}
            onChange={(e) => setForm((f) => ({ ...f, steps: e.target.value }))}
            multiline
            minRows={4}
            fullWidth
            error={!isValidJson(form.steps)}
            helperText={
              isValidJson(form.steps)
                ? 'Array of { device, cmd, value } objects'
                : 'Invalid JSON'
            }
            inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
          />
          {saveError && <Alert severity="error">{saveError.message}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onSave({ name: form.name.trim(), steps: JSON.parse(form.steps) })}
          disabled={!valid || saving}
        >
          {saving ? <CircularProgress size={18} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteDialog({ open, sequence, onClose, onConfirm, deleting }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete sequence?</DialogTitle>
      <DialogContent>
        <Typography>
          Delete <strong>{sequence?.name}</strong>? This cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={deleting}>
          {deleting ? <CircularProgress size={18} /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function SequencesPanel({ gwId, onBack }) {
  const [, setLoggedIn] = useContext(LoginContext);
  const queryClient = useQueryClient();
  const qKey = ['sequences', gwId];

  const [editTarget, setEditTarget] = useState(null);   // null = closed, {} = new, seq = edit
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: sequences = [], isPending, error } = useQuery({
    queryKey: qKey,
    queryFn: () => listSequences(gwId, setLoggedIn),
    select: (d) => (Array.isArray(d) ? d : d?.sequences ?? []),
  });

  const saveMutation = useMutation({
    mutationFn: (body) =>
      editTarget?.id
        ? updateSequence(gwId, editTarget.id, body, setLoggedIn)
        : createSequence(gwId, body, setLoggedIn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qKey });
      setEditTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteSequence(gwId, id, setLoggedIn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qKey });
      setDeleteTarget(null);
    },
  });

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={onBack} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">Sequences</Typography>
        </Stack>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setEditTarget({})}
        >
          New
        </Button>
      </Stack>

      {error && <Alert severity="error">{error.message}</Alert>}

      {isPending ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : sequences.length === 0 ? (
        <Typography color="text.secondary">No sequences yet.</Typography>
      ) : (
        <List disablePadding>
          {sequences.map((seq, i) => (
            <React.Fragment key={seq.id}>
              {i > 0 && <Divider />}
              <ListItem
                disablePadding
                secondaryAction={
                  <Stack direction="row" spacing={0}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() =>
                          setEditTarget({
                            id: seq.id,
                            name: seq.name,
                            steps: JSON.stringify(seq.steps ?? [], null, 2),
                          })
                        }
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => setDeleteTarget(seq)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Run — coming soon">
                      <span>
                        <IconButton size="small" disabled>
                          <PlayArrowIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                }
                sx={{ pr: 14 }}
              >
                <ListItemText
                  primary={seq.name}
                  secondary={`${(seq.steps ?? []).length} step${(seq.steps ?? []).length !== 1 ? 's' : ''}`}
                  sx={{ pl: 1 }}
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}

      <SequenceDialog
        open={editTarget !== null}
        initial={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={(body) => saveMutation.mutate(body)}
        saving={saveMutation.isPending}
        saveError={saveMutation.error}
      />

      <DeleteDialog
        open={deleteTarget !== null}
        sequence={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        deleting={deleteMutation.isPending}
      />
    </Box>
  );
}
