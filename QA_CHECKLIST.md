# Groove QA Checklist

Use this checklist before and after deployment for the current release.

## Pre-Deploy

- [ ] Run app locally over `http://localhost` and ensure it boots without console errors.
- [ ] Confirm Equalizer mode selector includes: Off, Auto EQ, 3-band, 5-band, 10-band, 15-band, 20-band, 31-band.
- [ ] Confirm Booster slider appears in Equalizer tools row.
- [ ] Confirm Booster range is 100% to 200% and value updates live.
- [ ] Confirm Limiter toggle still works.
- [ ] Confirm presets (Flat, Rock, Pop, Jazz, Vocal Boost, Bass Boost) apply correctly in manual modes.
- [ ] Confirm 31-band mode renders all controls and remains usable on desktop and mobile widths.
- [ ] Confirm Arrow Up / Arrow Down adjusts Booster by 5% when focus is not in an input.
- [ ] Confirm playback works for both audio and video tracks.
- [ ] Confirm app remains usable when offline after initial load.

## Deployment

- [ ] Deploy updated app assets.
- [ ] Confirm `service-worker.js` has updated `CACHE_VERSION`.
- [ ] Hard refresh once after deployment to pick up the latest service worker.

## Post-Deploy Smoke Test

- [ ] Open deployed app in a clean browser session.
- [ ] Confirm Equalizer new modes are available.
- [ ] Confirm Booster works and persists after page reload.
- [ ] Confirm active track playback, seek, shuffle, repeat, and next/prev all work.
- [ ] Confirm PWA install prompt behavior is unchanged.
- [ ] Confirm offline reload still serves app shell.

## Regression Guardrails

- [ ] No broken layout in header, player controls, playlist, or mini-player.
- [ ] No significant audio clipping with Booster at 200% and Limiter enabled.
- [ ] No JavaScript errors in browser console during 5+ minutes playback.
