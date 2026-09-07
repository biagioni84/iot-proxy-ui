import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const stopProp = (e) => e.stopPropagation();

export default function EntityRow({ icon, iconColor = 'text.secondary', label, value, subtitle, control }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.75, minWidth: 0 }}>
      {icon && (
        <Box sx={{ display: 'flex', color: iconColor, flexShrink: 0 }}>
          {icon}
        </Box>
      )}
      <Typography variant="body2" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
        {label}
      </Typography>
      {control ? (
        <Box onClick={stopProp} sx={{ flexShrink: 0 }}>
          {control}
        </Box>
      ) : (
        <Stack alignItems="flex-end" sx={{ flexShrink: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: subtitle ? 600 : 400 }} noWrap>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {subtitle}
            </Typography>
          )}
        </Stack>
      )}
    </Stack>
  );
}
