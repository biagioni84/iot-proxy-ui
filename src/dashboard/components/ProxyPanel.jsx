import * as React from 'react';
import { useState, useContext, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import SendIcon from '@mui/icons-material/Send';
import CancelIcon from '@mui/icons-material/Cancel';
import { LoginContext } from '../../App';
import { proxyRequest } from '../../api';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

const STATUS_COLOR = (status) => {
    if (!status) return 'default';
    if (status < 300) return 'success';
    if (status < 400) return 'warning';
    return 'error';
};

export default function ProxyPanel({ selectedGateway }) {
    const [loggedIn, setLoggedIn] = useContext(LoginContext);
    const [method, setMethod] = useState('GET');
    const [path, setPath] = useState('');
    const [body, setBody] = useState('');
    const [bodyError, setBodyError] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);
    const abortControllerRef = useRef(null);

    const hasBody = method === 'POST' || method === 'PUT';

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setLoading(false);
        setResponse({ status: null, data: { error: 'Request cancelled' } });
    };

    const handleSend = async () => {
        if (!path) return;

        if (hasBody && body) {
            try {
                JSON.parse(body);
                setBodyError('');
            } catch {
                setBodyError('Invalid JSON');
                return;
            }
        }

        abortControllerRef.current = new AbortController();
        setLoading(true);
        setResponse(null);
        try {
            const result = await proxyRequest({
                gwId: selectedGateway,
                path: path.startsWith('/') ? path.slice(1) : path,
                method,
                body: hasBody && body ? JSON.parse(body) : undefined,
                setLoggedIn,
                signal: abortControllerRef.current.signal,
            });
            setResponse(result);
        } catch (error) {
            if (error.name === 'AbortError') return;
            setResponse({ status: null, data: { error: error.message } });
        } finally {
            abortControllerRef.current = null;
            setLoading(false);
        }
    };

    return (
        <Grid size={{ xs: 12, lg: 9 }}>
            <Grid
                size={12}
                container
                direction="row"
                sx={{ justifyContent: 'space-between', alignItems: 'flex-end', mb: 2 }}
            >
                <Typography component="h2" variant="h6">
                    Proxy — {selectedGateway}
                </Typography>
            </Grid>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                {/* Request bar */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <FormControl sx={{ minWidth: 110 }} size="small">
                        <FormLabel>Method</FormLabel>
                        <Select
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            size="small"
                            disabled={loading}
                        >
                            {METHODS.map((m) => (
                                <MenuItem key={m} value={m}>{m}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl sx={{ flex: 1 }} size="small">
                        <FormLabel>Path</FormLabel>
                        <OutlinedInput
                            value={path}
                            onChange={(e) => setPath(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
                            placeholder="/status"
                            size="small"
                            disabled={loading}
                        />
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: '100%', pt: '22px' }}>
                        {loading ? (
                            <>
                                <CircularProgress size={20} sx={{ alignSelf: 'center' }} />
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={handleCancel}
                                    startIcon={<CancelIcon />}
                                >
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={handleSend}
                                disabled={!path}
                                endIcon={<SendIcon />}
                            >
                                Send
                            </Button>
                        )}
                    </Box>
                </Box>

                {/* Body */}
                {hasBody && (
                    <FormControl size="small">
                        <FormLabel>Body (JSON)</FormLabel>
                        <OutlinedInput
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder={'{\n  "key": "value"\n}'}
                            multiline
                            rows={4}
                            size="small"
                            error={!!bodyError}
                            disabled={loading}
                            sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                        />
                        {bodyError && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                {bodyError}
                            </Typography>
                        )}
                    </FormControl>
                )}

                {/* Response */}
                {response && (
                    <>
                        <Divider />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Response
                            </Typography>
                            {response.status && (
                                <Chip
                                    label={response.status}
                                    color={STATUS_COLOR(response.status)}
                                    size="small"
                                />
                            )}
                        </Box>
                        <Box
                            sx={{
                                backgroundColor: 'background.default',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                p: 2,
                                overflowX: 'auto',
                            }}
                        >
                            <Typography
                                component="pre"
                                sx={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.8rem',
                                    margin: 0,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all',
                                }}
                            >
                                {JSON.stringify(response.data, null, 2)}
                            </Typography>
                        </Box>
                    </>
                )}
            </Box>
        </Grid>
    );
}
