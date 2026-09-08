import * as React from 'react';
import { useContext } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { LoginContext } from '../../App';
import { devicePost } from '../gatewayApi';
import { hasAction, getStatusRows } from '../deviceFormat';
import EntityRow from './EntityRow';
import { lockVisual, switchVisual, batteryVisual, thermostatVisual, genericVisual } from './deviceVisuals';

// One row per entity in a device group. `switch` rows are interactive
// (toggle) when the matching turn_on/turn_off action exists; everything
// else — including grouped locks — renders read-only for now (see HAV1.md
// notes: we can't verify a status suffix and an action suffix address the
// same physical entity without a real multi-entity device to test against).
function SwitchRow({ gwId, device, row }) {
  const [, setLoggedIn] = useContext(LoginContext);
  const queryClient = useQueryClient();
  const suffix = row.index ? `_${row.index}` : '';
  const onAction = `turn_on${suffix}`;
  const offAction = `turn_off${suffix}`;
  const controllable = hasAction(device, onAction) && hasAction(device, offAction);
  const isOn = row.value === 'on';

  const mutation = useMutation({
    mutationFn: (on) => devicePost(gwId, device.id, on ? onAction : offAction, undefined, setLoggedIn),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gatewaySummary', gwId] }),
  });

  const { icon, color } = switchVisual(isOn);

  if (!controllable) {
    return <EntityRow icon={icon} iconColor={color} label={row.label} value={isOn ? 'On' : 'Off'} />;
  }

  return (
    <EntityRow
      icon={icon}
      iconColor={color}
      label={row.label}
      control={
        mutation.isPending
          ? <CircularProgress size={18} />
          : <Switch checked={isOn} onChange={(e) => mutation.mutate(e.target.checked)} size="small" />
      }
    />
  );
}

function rowVisual(row) {
  if (row.base === 'lock') return lockVisual(row.value);
  if (row.base === 'battery') return { ...batteryVisual(Number(row.value)), label: `${row.value}%` };
  if (row.base === 'climate') return { ...thermostatVisual(row.value), label: row.value };
  return { ...genericVisual(row.base, row.value), label: String(row.value ?? '—') };
}

export default function EntityGroup({ gwId, device, rows, maxRows }) {
  const all = rows ?? getStatusRows(device);
  const entries = maxRows ? all.slice(0, maxRows) : all;
  const hidden = all.length - entries.length;

  return (
    <Stack spacing={0}>
      {entries.map((row) => {
        if (row.base === 'switch') {
          return <SwitchRow key={row.key} gwId={gwId} device={device} row={row} />;
        }
        const { icon, color, label } = rowVisual(row);
        return <EntityRow key={row.key} icon={icon} iconColor={color} label={row.label} value={label} />;
      })}
      {hidden > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ pt: 0.5 }}>
          +{hidden} more
        </Typography>
      )}
    </Stack>
  );
}
