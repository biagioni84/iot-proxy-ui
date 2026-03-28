import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FormLabel from '@mui/material/FormLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import { styled } from '@mui/material/styles';
import { useState } from 'react';

const FormGrid = styled(Grid)(() => ({
  display: 'flex',
  flexDirection: 'column',
}));



function EditTunnel(props) {
  const {
    formState,
    onSubmit,
    onReset,
  } = props;
  const [useThisServer, setUseThisServer] = useState(formState?.use_this_server ?? true);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent default form submission on Enter
    }
  };
  // const [formValue,setFormValue]=useState(formState);
  // console.log("FORMSTATE:");
  // console.log(formState);
  return (
    <form onKeyDown={handleKeyDown}>


    <Grid container spacing={3}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Edit Tunnel
      </Typography>

      <FormGrid size={{ xs: 12 }}>
        <FormLabel htmlFor="name" required>
          Name
        </FormLabel>
        <OutlinedInput
          defaultValue={formState?.name}
          name="name"
          id="name"
          placeholder="Tunnel name"
          type="text"
          // autoComplete="shipping address-line1"
          required
          size="small"
        />
      </FormGrid>
      <FormGrid size={{ xs: 12, md: 8 }}>
        <FormLabel htmlFor="src_addr">
          Source Address
        </FormLabel>
        <OutlinedInput
          defaultValue={formState?.src_addr}
          id="src_addr"
          name="src_addr"
          placeholder="localhost"
          size="small"
        />
      </FormGrid>
      <FormGrid size={{ xs: 12, md: 4 }}>
        <FormLabel htmlFor="src_port" required>
          Source Port
        </FormLabel>
        <OutlinedInput
          defaultValue={formState?.src_port}
          id="src_port"
          name="src_port"
          required
          size="small"
        />
      </FormGrid>
      <FormGrid size={{ xs: 12, md: 8 }}>
        {useThisServer?
        <></>  :     
                <>
          <FormLabel htmlFor="dst_addr">
          Destination Address
        </FormLabel>
        <OutlinedInput
          defaultValue={formState?.dst_addr}
          id="dst_addr"
          name="dst_addr"
          placeholder="34.228.104.57"
          autoComplete="destination address"
          size="small"
        />      
        </> 
        }
      </FormGrid>
      <FormGrid size={{ xs: 12, md: 4 }}>
        <FormLabel htmlFor="dst_port" required>
          Destination Port
        </FormLabel>
        <OutlinedInput
          defaultValue={formState?.dst_port}
          id="dst_port"
          name="dst_port"
          required
          size="small"
        />
      </FormGrid>
<FormGrid size={12}>
<FormLabel >
          <Checkbox
          name="use_this_server"
  checked={useThisServer}
  onChange={(e)=>{setUseThisServer(e.target.checked)}}
  slotProps={{
    input: { 'aria-label': 'controlled' },
  }}
/>
          Use this server as destination
        </FormLabel>
</FormGrid>

      <Grid size={12}
        container
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <Button
          variant="contained"
          onClick={onReset}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          type="submit"
          onClick={onSubmit}
        >
          Save
        </Button>

      </Grid>

    </Grid>
    </form>

  );
}


export default EditTunnel;





