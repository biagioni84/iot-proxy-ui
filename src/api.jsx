import { baseUrl } from './Shared';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access')}`,
  };
}

function handleResponse(response, setLoggedIn) {
  if (response.status === 401 || response.status === 403) {
    if (setLoggedIn) setLoggedIn(false);
    localStorage.removeItem('access');
  }
  if (!response.ok) {
    throw new Error('Something went wrong, try again later');
  }
  return response;
}

function parseResponse(response) {
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }
  return response.json();
}

export async function fetchUserSummary(setLoggedIn) {
  const response = await fetch(baseUrl + 'api/v1/summary', { headers: authHeaders() });
  handleResponse(response, setLoggedIn);
  return parseResponse(response);
}

export async function fetchTunnels(gwId, setLoggedIn) {
  const response = await fetch(`${baseUrl}api/v1/${gwId}/tunnels`, { headers: authHeaders() });
  handleResponse(response, setLoggedIn);
  return parseResponse(response);
}

export async function saveTunnel(data, setLoggedIn) {
  const isNew = !data.id || data.id === 'new';
  const url = isNew
    ? `${baseUrl}api/v1/${data.gw_id}/tunnels`
    : `${baseUrl}api/v1/${data.gw_id}/tunnels/${data.id}`;

  const response = await fetch(url, {
    method: isNew ? 'POST' : 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({
      name: data.name,
      src_addr: data.src_addr,
      src_port: data.src_port,
      dst_port: data.dst_port,
      use_this_server: data.use_this_server,
    }),
  });
  handleResponse(response, setLoggedIn);
  return parseResponse(response);
}

export async function startStopTunnel(data, setLoggedIn) {
  const url = `${baseUrl}api/v1/${data.gw_id}/tunnels/${data.id}/${data.action}`;
  const response = await fetch(url, { method: 'POST', headers: authHeaders() });
  handleResponse(response, setLoggedIn);
  return parseResponse(response);
}

export async function sendDeleteTunnel(data, setLoggedIn) {
  const url = `${baseUrl}api/v1/${data.gw_id}/tunnels/${data.id}`;
  const response = await fetch(url, { method: 'DELETE', headers: authHeaders() });
  handleResponse(response, setLoggedIn);
  return parseResponse(response);
}

export async function proxyRequest({ gwId, path, method, body, setLoggedIn, signal }) {
  const url = `${baseUrl}api/v1/${gwId}/proxy/${path}`;
  const response = await fetch(url, {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });
  handleResponse(response, setLoggedIn);
  const data = await parseResponse(response);
  return { status: response.status, data };
}