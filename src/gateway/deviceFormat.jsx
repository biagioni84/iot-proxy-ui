// Adapts device objects from the gateway summary, which can be in either of two
// wire formats depending on the gateway's firmware: legacy (flat, one entry per
// HA entity, `status` is a scalar) or HAv1 (grouped, one entry per HA device,
// `status` is an object keyed by label, `actions` lists what that specific
// device supports). See HAV1.md for the full spec.

export function isHAv1(device) {
  return Array.isArray(device?.actions);
}

// Reads a labeled value out of `status`, honoring the `_1`/`_2` collision
// suffixing HAv1 uses when a device groups two entities with the same label.
// Ignored for legacy, where `status` is already the single scalar value.
export function getStatus(device, label) {
  if (!isHAv1(device)) return device?.status;
  const status = device?.status ?? {};
  if (label in status) return status[label];
  if (`${label}_1` in status) return status[`${label}_1`];
  return undefined;
}

export function getBattery(device) {
  if (!isHAv1(device)) return device?.battery ?? null;
  const raw = getStatus(device, 'battery');
  return raw != null ? Number(raw) : null;
}

// True if this device supports `action` (or its `_1` grouped variant).
// Legacy devices don't carry an `actions` list — assumed true, since legacy's
// fixed per-type command set is what the caller is already relying on.
export function hasAction(device, action) {
  if (!isHAv1(device)) return true;
  const actions = device?.actions ?? [];
  return actions.includes(action) || actions.includes(`${action}_1`);
}

// Resolves the actual action name to call: `action` itself if present,
// otherwise its `_1` grouped variant. Legacy devices pass the name through
// unchanged (hasAction is always true there, so this is only ever narrowing).
export function resolveAction(device, action) {
  if (!isHAv1(device)) return action;
  const actions = device?.actions ?? [];
  if (actions.includes(action)) return action;
  if (actions.includes(`${action}_1`)) return `${action}_1`;
  return action;
}

// True when a HAv1 device groups more than one entity of the same label
// (e.g. two switches → `switch_1`/`switch_2` in `status`) — signals that the
// single-widget Lock/Switch/ThermostatControl (which only ever address the
// first instance) should hand off to the generic per-entity row renderer.
export function isMultiEntity(device) {
  if (!isHAv1(device)) return false;
  const status = device?.status ?? {};
  return Object.keys(status).some((k) => /_\d+$/.test(k));
}

function splitSuffix(key) {
  const m = key.match(/^(.*)_(\d+)$/);
  return m ? { base: m[1], index: Number(m[2]) } : { base: key, index: null };
}

function humanize(s) {
  const words = String(s).replace(/_/g, ' ').split(' ');
  return words.map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(' ');
}

// One row per status entry — for legacy that's always a single row (the
// scalar `status`, labeled by the device's own type); for HAv1 it's one row
// per key in the `status` object, with the `_N` suffix (if any) folded into
// a readable label ("Occupancy 1") instead of shown as a raw key.
export function getStatusRows(device) {
  if (!isHAv1(device)) {
    return [{ key: device?.type ?? 'status', base: device?.type ?? 'status', index: null, label: humanize(device?.type ?? 'Status'), value: device?.status }];
  }
  const status = device?.status ?? {};
  return Object.entries(status).map(([key, value]) => {
    const { base, index } = splitSuffix(key);
    return { key, base, index, label: humanize(base) + (index ? ` ${index}` : ''), value };
  });
}
