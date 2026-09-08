import * as React from 'react';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PowerIcon from '@mui/icons-material/Power';
import PowerOffIcon from '@mui/icons-material/PowerOff';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import Battery20Icon from '@mui/icons-material/Battery20';
import Battery50Icon from '@mui/icons-material/Battery50';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import PersonIcon from '@mui/icons-material/Person';
import LightModeIcon from '@mui/icons-material/LightMode';
import SensorsIcon from '@mui/icons-material/Sensors';

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

const GENERIC_ICONS = {
  occupancy: PersonIcon,
  motion: PersonIcon,
  illuminance: LightModeIcon,
  temperature: ThermostatIcon,
};

// Fallback icon/color for status labels with no dedicated widget (occupancy,
// illuminance, tamper, contact, ...) — used by the generic multi-row renderer.
export function genericVisual(base, value) {
  const Icon = GENERIC_ICONS[base] ?? SensorsIcon;
  const inactive = value === 'off' || value === 'clear' || value === false;
  return { icon: <Icon fontSize="small" />, color: inactive ? 'text.disabled' : 'text.secondary' };
}
