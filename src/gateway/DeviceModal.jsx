import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DeviceDetail from './DeviceDetail';

export default function DeviceModal({ gwId, device, onClose }) {
  return (
    <Dialog
      open={!!device}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
    >
      {device && (
        <DialogContent sx={{ p: 3 }}>
          <DeviceDetail gwId={gwId} device={device} onClose={onClose} />
        </DialogContent>
      )}
    </Dialog>
  );
}
