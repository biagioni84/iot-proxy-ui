# Backlog

## HAv1 device format — needs verification against real hardware

Added in #4 (`feat: support HAv1 grouped device summary format alongside
legacy`). Implemented against `HAV1.md` without a live HAv1 gateway to
confirm against for these specific cases — revisit once real hardware is
available.

- **Lock read/write.** No `lock` entity existed on the reference HA
  instance used while building this, so `getStatus(device, 'lock')` and
  `setLockState()` (`src/gateway/deviceFormat.jsx`,
  `src/gateway/gatewayApi.jsx`) are unverified end-to-end.
- **Dimmer "current brightness" status label.** `set_level`'s write side
  is documented; the read side isn't — `DimmerSection` in
  `src/gateway/components/SwitchControl.jsx` guesses `status.level` then
  falls back to `status.brightness`. Confirm the real label (or that
  brightness isn't exposed in `status` at all).
- **Multi-entity status/action suffix correlation.** `EntityGroup`
  (`src/gateway/components/EntityGroup.jsx`) assumes a `status` key's
  `_N` suffix (e.g. `switch_2`) lines up with the same-index `_N` suffix
  on its actions (`turn_on_2`/`turn_off_2`) for the same physical entity.
  Unverified — needs a real device that groups 2+ entities of the same
  kind (e.g. a multi-relay switch) to confirm before trusting it for
  anything beyond the first instance.
- **`set_temperature` body shape.** Spec allows `{heat}`/`{cool}` and/or
  `{temperature}`; `setThermostatSetpoint()` always sends `{heat}`/
  `{cool}`. Unconfirmed whether a single-setpoint HAv1 climate device
  requires `{temperature}` instead.
