import * as React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Copyright from '../internals/components/Copyright';
import GatewaysList from './GatewaysList';
import TunnelList from './TunnelList';
import ProxyPanel from './ProxyPanel';
import DevicesPage from '../../gateway/DevicesPage';
import { useState } from 'react';


export default function SummaryPage(props) {
  const [selectedGateway, setSelectedGateway] = useState("");
  const [selectedDetail, setSelectedDetail] = useState("none");

  const handleGWSelect = (gw, detail) => {
    setSelectedGateway(gw);
    setSelectedDetail(detail);
  }

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Summary
      </Typography>
      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12, lg: 9 }}>
          <GatewaysList summary={props.summary} onSelect={handleGWSelect} />
        </Grid>
        {selectedDetail === 'tunnels' && (
          <TunnelList summary={props.summary} selectedGateway={selectedGateway} />
        )}
        {selectedDetail === 'proxy' && (
          <ProxyPanel selectedGateway={selectedGateway} />
        )}
        {selectedDetail === 'devices' && (
          <Grid size={{ xs: 12 }}>
            <DevicesPage gwId={selectedGateway} />
          </Grid>
        )}
      </Grid>
      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}
