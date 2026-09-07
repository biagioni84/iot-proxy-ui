import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import FormLabel from '@mui/material/FormLabel';
import OutlinedInput from '@mui/material/OutlinedInput';

export default function AddGateway({ open, onClose, onSubmit, isPending, errorMessage }) {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
      event.preventDefault();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={onSubmit} onKeyDown={handleKeyDown}>
        <DialogTitle>Add Gateway</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            <Stack spacing={0.5}>
              <FormLabel htmlFor="gatewayId" required>
                Gateway ID
              </FormLabel>
              <OutlinedInput
                id="gatewayId"
                name="gatewayId"
                placeholder="e.g. gw-001"
                size="small"
                autoFocus
                required
              />
            </Stack>
            <Stack spacing={0.5}>
              <FormLabel htmlFor="publicKey" required>
                Public Key
              </FormLabel>
              <OutlinedInput
                id="publicKey"
                name="publicKey"
                placeholder="ssh-ed25519 AAAA..."
                size="small"
                multiline
                minRows={3}
                required
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? 'Adding...' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
