import * as React from 'react';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PowerIcon from '@mui/icons-material/Power';
import PowerOffIcon from '@mui/icons-material/PowerOff';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import Battery20Icon from '@mui/icons-material/Battery20';
import Battery50Icon from '@mui/icons-material/Battery50';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';

export function lockVisual(status) {
  if (status === 'locked') {
    return { icon: <LockIcon fontSize="small" />, color: 'success.main', label: 'Locked' };
  }
  if (status === 'unlocked') {
    return { icon: <LockOpenIcon fontSize="small" />, color: 'text.disabled', label: 'Unlocked' };
  }
  return { icon: <LockIcon fontSize="small" />, color: 'text.disabled', label: 'Unknown' };
}

export function switchVisual(isOn) {
  return isOn
    ? { icon: <PowerIcon fontSize="small" />, color: 'warning.main' }
    : { icon: <PowerOffIcon fontSize="small" />, color: 'text.disabled' };
}

export function thermostatVisual(mode) {
  const colors = { heat: 'error.main', cool: 'info.main', auto: 'success.main' };
  return { icon: <ThermostatIcon fontSize="small" />, color: colors[mode] ?? 'text.disabled' };
}

export function batteryVisual(level) {
  if (level == null) return null;
  if (level < 20) return { icon: <Battery20Icon fontSize="small" />, color: 'error.main' };
  if (level < 50) return { icon: <Battery50Icon fontSize="small" />, color: 'warning.main' };
  return { icon: <BatteryFullIcon fontSize="small" />, color: 'text.disabled' };
}
