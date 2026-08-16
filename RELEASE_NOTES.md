# Groove Release Notes

## v1.0.5 - 2026-04-12

### Added

- Added additional graphic EQ formats:
  - 15-band (2/3 octave style coverage)
  - 20-band (1/2 octave style coverage)
  - 31-band (1/3 octave, pro-style layout)
- Added a Volume Booster control in the EQ panel.
  - Range: 100% to 200%
  - Live percentage readout
  - Keyboard control: Arrow Up / Arrow Down (5% steps)

### Improved

- Expanded EQ preset application across all manual EQ modes.
- Improved EQ grid responsiveness for high-band-count layouts.
- Persisted booster level in local storage.
- Preserved cross-media behavior for both audio and video tracks.

### PWA / Caching

- Bumped service-worker cache version to `v1.0.5` so clients pick up the new build.

### Notes

- On browsers without Web Audio support, playback still works but boosting above 100% is not available.
