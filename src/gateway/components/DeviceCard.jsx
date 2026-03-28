import * as React from 'react';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import LockIcon from '@mui/icons-material/Lock';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import SensorsIcon from '@mui/icons-material/Sensors';

function TypeIcon({ type }) {
  const icons = {
    lock: <LockIcon />,
    switch: <PowerSettingsNewIcon />,
    thermostat: <ThermostatIcon />,
  };
  return icons[type] ?? <SensorsIcon />;
}

function StatusChip({ status }) {
  if (!status) return null;
  const color = status === 'locked' || status === 'on' ? 'success' : 'default';
  return <Chip label={status} color={color} size="small" />;
}

function BatteryChip({ battery }) {
  if (battery === null || battery === undefined) return null;
  const color = battery < 20 ? 'error' : battery < 50 ? 'warning' : 'success';
  return (
    <Chip label={`${battery}%`} color={color} size="small" variant="outlined" />
  );
}

export default function DeviceCard({ device, onClick }) {
  const displayName = device.name || device.node || device.id;

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea onClick={() => onClick(device)} sx={{ height: '100%' }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Box sx={{ color: 'primary.main', display: 'flex' }}>
              <TypeIcon type={device.type} />
            </Box>
            <Typography variant="subtitle2" noWrap sx={{ flexGrow: 1 }}>
              {displayName}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            {device.type} · {device.protocol}
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            <StatusChip status={device.status} />
            <BatteryChip battery={device.battery} />
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
