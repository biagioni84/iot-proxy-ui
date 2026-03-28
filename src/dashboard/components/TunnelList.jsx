import * as React from 'react';
import { DataGrid, GridActionsCellItem, gridClasses } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useState, useContext } from 'react';
import { LoginContext } from '../../App';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import EditTunnel from './EditTunnel';
import { saveTunnel, sendDeleteTunnel, startStopTunnel, fetchTunnels } from '../../api';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';

function TunnelStateChip({ state }) {
    const config = {
        ACTIVE:  { label: 'Active',  color: 'success' },
        STOPPED: { label: 'Stopped', color: 'default' },
        ERROR:   { label: 'Error',   color: 'error'   },
    };
    const { label, color } = config[state] ?? { label: state, color: 'default' };
    return <Chip label={label} color={color} size="small" />;
}

export default function TunnelList(props) {
    const [loggedIn, setLoggedIn] = useContext(LoginContext);
    const selectedGateway = props.selectedGateway;
    const [editTunnel, setEditTunnel] = useState();
    const [confirmDelete, setConfirmDelete] = useState(null); // row a borrar
    const queryClient = useQueryClient();
    const handleAddTunnel = () => {
        setEditTunnel(true);
    }

    const [formState, setFormState] = useState();
    const handleFormReset = () => {
        setEditTunnel(false);
        setFormState({});
    };

    const updateTunnel = useMutation({
        mutationFn: (row) => saveTunnel(row, setLoggedIn),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userData'] });
            queryClient.invalidateQueries({ queryKey: ['tunnels', selectedGateway] });
        },
        onError: (error) => {
            console.error('Error saving tunnel:', error);
        },
    });
    const deleteTunnel = useMutation({
        mutationFn: (row) => sendDeleteTunnel(row, setLoggedIn),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userData'] });
            queryClient.invalidateQueries({ queryKey: ['tunnels', selectedGateway] });
        },
        onError: (error) => {
            console.error('Error deleting tunnel:', error);
        },
    });
    const toggleTunnel = useMutation({
        mutationFn: (row) => startStopTunnel(row, setLoggedIn),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userData'] });
            queryClient.invalidateQueries({ queryKey: ['tunnels', selectedGateway] });
        },
        onError: (error) => {
            console.error('Error toggling tunnel:', error);
        },
    });
    const handleFormSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target.form);
        const formObject = Object.fromEntries(formData.entries());
        formObject.id = formState?.id;
        formObject.gw_id = selectedGateway;
        updateTunnel.mutate(formObject);
        handleFormReset();
    };
    const handleDelete = (row) => {
        setConfirmDelete(row);
    }
    const handleConfirmDelete = () => {
        deleteTunnel.mutate(confirmDelete);
        setConfirmDelete(null);
        handleFormReset();
    }
    const handleCancelDelete = () => {
        setConfirmDelete(null);
    }

    const { data: tunnelsData, isPending: tunnelsPending } = useQuery({
        queryKey: ['tunnels', selectedGateway],
        queryFn: () => fetchTunnels(selectedGateway, setLoggedIn),
        enabled: typeof selectedGateway === 'string' && selectedGateway !== '',
    });

    const rows = [];

    if (typeof selectedGateway === 'string' && selectedGateway !== '' && tunnelsData) {
        Object.entries(tunnelsData).forEach(([key, value]) => {
            rows.push({
                gw_id: selectedGateway,
                id: key,
                name: value.name,
                src_addr: value?.src_addr,
                src_port: value?.src_port,
                dst_addr: value?.dst_addr,
                dst_port: value?.dst_port,
                src: value?.src_addr + ":" + value?.src_port,
                dst: value?.dst_addr + ":" + value?.dst_port,
                state: value?.state ?? 'STOPPED',
            });
        });
    }

    const handleEdit = (row) => {
        setEditTunnel(true);
        setFormState(row);
    }
    const handleStartTunnel = (row) => { toggleTunnel.mutate({ gw_id: row.gw_id, id: row.id, action: 'start' }) }
    const handleStopTunnel = (row) => { toggleTunnel.mutate({ gw_id: row.gw_id, id: row.id, action: 'stop' }) }

    const columns = [
        {
            field: 'state',
            headerName: 'State',
            flex: 0.6,
            minWidth: 90,
            renderCell: (params) => <TunnelStateChip state={params.value} />,
        },
        {
            field: 'name',
            headerName: 'Name',
            flex: 2,
            minWidth: 150
        },
        {
            field: 'src',
            headerName: 'From',
            flex: 1,
            minWidth: 100
        },
        {
            field: 'dst',
            headerName: 'To',
            flex: 1,
            minWidth: 100
        },
        {
            spacing: 0,
            field: 'actions',
            type: 'actions',
            headerAlign: 'right',
            align: 'right',
            flex: 1,
            minWidth: 100,
            getActions: ({ row }) => [
                <GridActionsCellItem
                    spacing={0}
                    key="start-item"
                    icon={<PlayArrowIcon />}
                    label="Start"
                    onClick={()=>{handleStartTunnel(row)}}

                />,
                <GridActionsCellItem
                    spacing={0}

                    key="stop-item"
                    icon={<StopIcon />}
                    label="Stop"
                    onClick={()=>{handleStopTunnel(row)}}

                />,
                <GridActionsCellItem
                    spacing={0}

                    key="edit-item"
                    icon={<EditIcon />}
                    label="Edit"
                    onClick={() => { handleEdit(row) }}
                />,
                <GridActionsCellItem
                    key="delete-item"
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={() => { handleDelete(row) }}
                />,
            ],
        }
    ]
        ;


    return (

        <Grid size={{ xs: 12, lg: 9 }}>


            <Grid size={12}
                container
                direction="row"
                sx={{
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                }}
            >

                <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                    Tunnels for {selectedGateway}
                </Typography>

                <Button onClick={handleAddTunnel}>
                    <AddIcon />    </Button>


            </Grid>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <DataGrid
                    disableRowSelectionOnClick
                    sx={{
                        '--DataGrid-overlayHeight': '36px',
                        '& .MuiDataGrid-actionsCell .MuiIconButton-root': {
                            margin: 0, // Adjust margin as needed
                            padding: 0,
                            float: 'right',
                            width: 'fit-content',
                            outline: 'none',
                            border: 'none',
                        },
                        [`& .${gridClasses.columnHeader}, & .${gridClasses.cell}`]: {
                            outline: 'transparent',
                        },
                        [`& .${gridClasses.columnHeader}:focus-within, & .${gridClasses.cell}:focus-within`]:
                        {
                            outline: 'none',
                        },
                        [`& .${gridClasses.row}:hover`]: {
                            cursor: 'pointer',
                        },
                    }}
                    rows={rows}
                    columns={columns}
                    getRowClassName={(params) =>
                        params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
                    }
                    initialState={{
                        pagination: { paginationModel: { pageSize: 20 } },
                        sorting: { sortModel: [{ field: 'name', sort: 'asc' }] },
                    }}
                    pageSizeOptions={[10, 20, 50]}
                    density="compact"
                />
                {editTunnel ?
                    <EditTunnel
                        formState={formState}
                        onSubmit={handleFormSubmit}
                        onReset={handleFormReset}
                    />
                    : <></>
                }

            </div>

            <Dialog open={!!confirmDelete} onClose={handleCancelDelete}>
                <DialogTitle>Delete tunnel</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <strong>{confirmDelete?.name}</strong>? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

        </Grid>
    );
}
