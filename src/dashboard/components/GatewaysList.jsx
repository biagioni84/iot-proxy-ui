import * as React from 'react';
import { DataGrid, GridActionsCellItem, gridClasses } from '@mui/x-data-grid';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { useContext, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoginContext } from '../../App';
import { createGateway } from '../../api';
import AddGateway from './AddGateway';
import InfoIcon from '@mui/icons-material/Info';
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';

export default function GatewaysList(props) {
    const [loggedIn, setLoggedIn] = useContext(LoginContext);
    const [addOpen, setAddOpen] = useState(false);
    const queryClient = useQueryClient();
    const handleAction = (row) => {
        console.log(row.key)
    }

    const createGatewayMutation = useMutation({
        mutationFn: (data) => createGateway(data, setLoggedIn),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userData'] });
            setAddOpen(false);
        },
    });

    const handleAddOpen = () => {
        createGatewayMutation.reset();
        setAddOpen(true);
    };
    const handleAddClose = () => {
        setAddOpen(false);
        createGatewayMutation.reset();
    };
    const handleAddSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        createGatewayMutation.mutate(Object.fromEntries(formData.entries()));
    };
    function renderStatus(status) {
        const colors = {
            Online: 'success',
            Offline: 'default',
        };


        return <><Chip label={status} color={colors[status]} size="small" /><GridActionsCellItem
            key="ping-item"
            id="ping"
            sx={{
                outline: 'none',
                border: 'none',
                '&:focus': {
                    outline: 'none',
                    border: 'none',
                },

            }}
            icon={<RefreshIcon />}
            label="Edit"
            onClick={handleAction}
        /></>;
    }
    // console.log(props.summary);

    // const tunnelDetail = 

    const gateways = props.summary?.gateways ?? {};
    const rows = Object.entries(gateways).map(([key, value]) => {
        const rawStatus = typeof value.status === 'string' ? value.status : (value.status?.connection ?? 'UNKNOWN');
        const displayStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
        return {
            id: key,
            gateway_id: key,
            status: displayStatus,
            tunnels: (value.active_tunnel_count ?? 0) + "/" + (value.tunnel_count ?? 0),
        };
    });
    // if (isPending) {
    //     return 'Loading...';
    // } else {

    // }

    // if (error) return 'An error has occurred: ' + error.message


    const columns = [
        {
            field: 'gateway_id',
            headerName: 'Gateway ID',
            flex: 1.5,
            minWidth: 200
        },
        {
            field: 'tunnels',
            headerName: 'Tunnels',
            flex: 0.5,
            minWidth: 80,
            renderCell: (params) => {
                return <> {params.value}
                    {<GridActionsCellItem
                        key="info-item"
                        sx={{
                            outline: 'none',
                            border: 'none',
                            '&:focus': {
                                outline: 'none',
                                border: 'none',
                            },

                        }}
                        icon={<SettingsIcon />}
                        label="Edit"
                        onClick={(e) => {
                            e.stopPropagation();
                            props.onSelect(params.id, "tunnels");
                        }}
                    />}
                </>

            },
        },
        {
            field: 'status',
            headerName: 'Status',
            flex: 1,
            minWidth: 150,
            renderCell: (params) => renderStatus(params.value),
        },
        {
            field: 'actions',
            type: 'actions',
            headerAlign: 'right',
            align: 'right',
            flex: 1,
            minWidth: 80,
            getActions: ({ row }) => [
                <GridActionsCellItem
                    key="info-item"
                    icon={<InfoIcon />}
                    label="Edit"
                    onClick={handleAction}
                />,
                <GridActionsCellItem
                    key="delete-item"
                    icon={<DisplaySettingsIcon />}
                    label="Proxy"
                    onClick={(e) => { e.stopPropagation(); props.onSelect(row.id, 'proxy'); }}
                />,
            ],
        }

    ]
        ;


    return (
        <>
        <Grid
            container
            direction="row"
            sx={{
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                mb: 1,
            }}
        >
            <Typography component="h2" variant="h6">
                Gateways
            </Typography>
            <Button onClick={handleAddOpen}>
                <AddIcon />
            </Button>
        </Grid>
        <DataGrid

            // checkboxSelection
            disableRowSelectionOnClick
            // showToolbar
            sx={{
                // Example: targeting icons within a specific column type
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
            onRowClick={(params) => props.onSelect(params.id, 'devices')}
            rows={rows}
            columns={columns}
            getRowClassName={(params) =>
                params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
            }
            initialState={{
                pagination: { paginationModel: { pageSize: 20 } },
            }}
            pageSizeOptions={[10, 20, 50]}
            disableColumnResize
            density="compact"
            slotProps={{
                filterPanel: {
                    filterFormProps: {
                        logicOperatorInputProps: {
                            variant: 'outlined',
                            size: 'small',
                        },
                        columnInputProps: {
                            variant: 'outlined',
                            size: 'small',
                            sx: { mt: 'auto' },
                        },
                        operatorInputProps: {
                            variant: 'outlined',
                            size: 'small',
                            sx: { mt: 'auto' },
                        },
                        valueInputProps: {
                            InputComponentProps: {
                                variant: 'outlined',
                                size: 'small',
                            },
                        },
                    },
                },
            }}
        />
        <AddGateway
            open={addOpen}
            onClose={handleAddClose}
            onSubmit={handleAddSubmit}
            isPending={createGatewayMutation.isPending}
            errorMessage={createGatewayMutation.error?.message}
        />
        </>
    );
}
