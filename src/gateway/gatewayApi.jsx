import { proxyRequest } from '../api';

export async function fetchGatewaySummary(gwId, setLoggedIn) {
  const { data } = await proxyRequest({ gwId, path: 'summary', method: 'GET', setLoggedIn });
  return data;
}

export async function deviceGet(gwId, deviceId, endpoint, setLoggedIn) {
  const { data } = await proxyRequest({
    gwId,
    path: `${deviceId}/${endpoint}`,
    method: 'GET',
    setLoggedIn,
  });
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function devicePost(gwId, deviceId, endpoint, body, setLoggedIn) {
  const { data } = await proxyRequest({
    gwId,
    path: `${deviceId}/${endpoint}`,
    method: 'POST',
    body,
    setLoggedIn,
  });
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function deviceDelete(gwId, deviceId, endpoint, setLoggedIn) {
  const { data } = await proxyRequest({
    gwId,
    path: `${deviceId}/${endpoint}`,
    method: 'DELETE',
    setLoggedIn,
  });
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function fetchPincodes(gwId, deviceId, setLoggedIn) {
  const { data } = await proxyRequest({
    gwId,
    path: `${deviceId}/poll_pincodes`,
    method: 'GET',
    setLoggedIn,
  });
  if (data?.error) throw new Error(data.error);
  // Returns { pincodes: { "1": "1234", "3": "5678" } }
  return data?.pincodes ?? {};
}

export async function setPincode(gwId, deviceId, slot, code, setLoggedIn) {
  const { data } = await proxyRequest({
    gwId,
    path: `${deviceId}/pincode/${slot}`,
    method: 'POST',
    body: { code },
    setLoggedIn,
  });
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function deletePincode(gwId, deviceId, slot, setLoggedIn) {
  const { data } = await proxyRequest({
    gwId,
    path: `${deviceId}/pincode/${slot}`,
    method: 'DELETE',
    setLoggedIn,
  });
  if (data?.error) throw new Error(data.error);
  return data;
}

// Gateway-level operations (not device-scoped)
async function gatewayPost(gwId, path, body, setLoggedIn) {
  const { data } = await proxyRequest({ gwId, path, method: 'POST', body, setLoggedIn });
  if (data?.error) throw new Error(data.error);
  return data;
}

export const startInclusion = (gwId, protocol, setLoggedIn) =>
  gatewayPost(gwId, 'include', { protocol, command: 'start' }, setLoggedIn);

export const stopInclusion = (gwId, protocol, setLoggedIn) =>
  gatewayPost(gwId, 'include', { protocol, command: 'stop' }, setLoggedIn);

export const startExclusion = (gwId, setLoggedIn) =>
  gatewayPost(gwId, 'exclude', { protocol: 'zwave', command: 'start' }, setLoggedIn);

export const stopExclusion = (gwId, setLoggedIn) =>
  gatewayPost(gwId, 'exclude', { protocol: 'zwave', command: 'stop' }, setLoggedIn);

// Sequences
async function gatewayGet(gwId, path, setLoggedIn) {
  const { data } = await proxyRequest({ gwId, path, method: 'GET', setLoggedIn });
  if (data?.error) throw new Error(data.error);
  return data;
}

async function gatewayPut(gwId, path, body, setLoggedIn) {
  const { data } = await proxyRequest({ gwId, path, method: 'PUT', body, setLoggedIn });
  if (data?.error) throw new Error(data.error);
  return data;
}

async function gatewayDelete(gwId, path, setLoggedIn) {
  const { data } = await proxyRequest({ gwId, path, method: 'DELETE', setLoggedIn });
  if (data?.error) throw new Error(data.error);
  return data;
}

export const listSequences = (gwId, setLoggedIn) =>
  gatewayGet(gwId, 'sequences', setLoggedIn);

export const createSequence = (gwId, body, setLoggedIn) =>
  gatewayPost(gwId, 'sequences', body, setLoggedIn);

export const updateSequence = (gwId, id, body, setLoggedIn) =>
  gatewayPut(gwId, `sequences/${id}`, body, setLoggedIn);

export const deleteSequence = (gwId, id, setLoggedIn) =>
  gatewayDelete(gwId, `sequences/${id}`, setLoggedIn);

// Device management
export const renameDevice = (gwId, deviceId, name, setLoggedIn) =>
  gatewayPost(gwId, `${deviceId}/name`, { value: name }, setLoggedIn);

export const deleteDevice = (gwId, deviceId, setLoggedIn) =>
  gatewayDelete(gwId, deviceId, setLoggedIn);

// Z-Wave network
export const reinterviewDevice = (gwId, nodeId, setLoggedIn) =>
  gatewayPost(gwId, `zwave/interview/${nodeId}`, {}, setLoggedIn);

export const refreshZwaveNetwork = (gwId, setLoggedIn) =>
  gatewayPost(gwId, 'zwave/update_network', {}, setLoggedIn);
