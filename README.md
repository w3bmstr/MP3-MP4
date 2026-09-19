# 🎵 Groove — PWA Music Player

A beautiful, offline-first Progressive Web App music player built with
vanilla HTML, CSS, and JavaScript. No frameworks. No build step.

---

## ✨ What's new in v1.3 — Studio-grade DSP

- **Preamp** — a dedicated gain stage so you can push the EQ without clipping.
- **Parametric EQ (5-band)** — fully adjustable frequency, gain, and Q per
  band, independent of the graphic EQ.
- **Crossfeed** — blends a low-passed amount of each channel into the
  other for a more natural, less fatiguing headphone image.
- **Convolution DSP** — Small Room / Concert Hall / Plate Reverb spaces
  built from synthesized impulse responses, plus support for loading your
  own IR file, with a wet/dry mix control.
- **Loudness normalization** — learns each track's level as it plays and
  evens it out over time (RMS-based, ReplayGain-*style* — see note below).
- **Gapless-optimized playback** — preloads the next track ahead of time
  to minimize the gap between songs.
- **Real-time spectrum analyzer** — a proper frequency-bar visualizer,
  switchable with the oscilloscope waveform view, plus a clip indicator.
- **ABX blind test** — can you actually hear your DSP chain? Take a blind
  A/B/X test and track your score.
- **Bookmarks** — mark a spot in a long track or podcast and jump back to
  it later.
- **Picture-in-picture** — pop video tracks out into a floating window.
- **Per-track DSP profiles** — parametric EQ, crossfeed, convolution, and
  speed settings are remembered per track and recalled automatically.

### A note on what a browser can and can't do

A few classic "audiophile" features are outside what any web app can
control, because they're decided by the operating system and hardware,
not by JavaScript:

- **Bit-perfect / exclusive output and USB DAC mode** — the OS audio
  mixer sits between any browser and your DAC; there's no web API to
  bypass it.
- **Forcing a specific Bluetooth codec (LDAC, aptX HD, etc.)** — codec
  negotiation happens in the OS/Bluetooth stack, invisible to web pages.
- **DSD and MQA decoding** — no browser ships a decoder for either
  format; there's no way to add one from a web app.
- **True multi-room/multi-device sync** — possible in principle, but it
  needs a signaling server and is a separate project from a static,
  local-file player.

Where the list overlapped with things browsers already do natively —
**FLAC, ALAC, WAV, and AIFF playback** — those just work through the
`<audio>` element's built-in codec support, and the file picker now
accepts them directly.

Also worth being precise about: **"gapless" here means preload-optimized,
not sample-accurate** — it meaningfully shrinks the gap between tracks
but isn't a guarantee of zero-sample-perfect transitions. And **loudness
normalization is a simplified RMS-based approach**, not a certified EBU
R128/ReplayGain implementation — it's a real, working feature, just not
a lab-calibrated one.

---

## ✨ What's new in v1.1

- **Favorites** — star any track from the player or the queue; filter the
  queue to favorites only.
- **Search** — instantly filter the queue by title or artist.
- **Playback speed** — 0.5×–2× with pitch correction, adjustable via the
  slider or `[` / `]`.
- **A/B repeat** — mark a loop start and end point and practice a passage
  on repeat; the loop range is shown right on the seek bar.
- **Sleep timer** — 15/30/45/60 minutes or "end of track," with a smooth
  20-second volume fade-out before playback pauses.
- **Resume where you left off** — the current track and playback position
  are remembered across reloads.
- **Drag-to-reorder queue** — grab the handle on any track row (desktop)
  to reorder the queue; the order is remembered.
- **Keyboard shortcuts dialog** — press `?` any time to see every shortcut.

---

## 🎚️ High-End Equalizer (EQ) App — Full Feature List

### Core Audio Processing
- Multi-band parametric EQ: fully adjustable frequency, Q-factor, and gain per band
- Graphic EQ modes: 10-band, 15-band, 31-band options
- Linear-phase and minimum-phase processing for transparent or analog-style sound
- Real-time spectrum analyzer: FFT display, peak hold, zoomable frequency view
- Preamp gain control to prevent clipping or boost overall output
- Dynamic EQ: frequency-dependent compression/expansion
- Multi-stage processing: chain multiple EQs, compressors, limiters, and more

### Advanced Audio Tools
- Compressor / limiter / expander with attack, release, ratio, and knee
- Bass boost / subharmonic synthesizer for controlled low-end enhancement
- Stereo widening / narrowing with mid-side (M/S) processing
- Crossfeed for headphone listening realism
- Loudness normalization (EBU R128 or ReplayGain)
- Room correction with calibration file import (WAV, TXT filters)

### Presets & Customization
- Factory presets: genre-based, device-based, or environment-based
- User-created presets: save, export, import
- Auto-switch presets by device, headphones, or app
- Per-song or per-album EQ with automatic recall

### Integration & Compatibility
- System-wide audio processing that affects all apps
- Hi-Res audio support: 24-bit/192 kHz, DSD passthrough
- Bluetooth codec awareness: LDAC, aptX, AAC, SBC
- Virtual surround / spatial audio with 3D sound simulation

### UI & Workflow
- Gesture-based EQ curve editing
- Dark/light themes
- A/B comparison between two EQ profiles
- Undo/redo history
- Latency compensation for real-time use

---

## 🎵 High-End MP3/MP4 Player App — Full Feature List

### Playback & Audio Quality
- Support for major formats: MP3, AAC, FLAC, ALAC, WAV, OGG, DSD, MP4, MKV
- Gapless playback for live albums
- Crossfade with adjustable duration
- ReplayGain / loudness normalization
- Hi-Res output with bit-perfect mode and exclusive audio path
- Built-in EQ: graphic or parametric (if not using external EQ)

### Library & Metadata Management
- Auto-scan library: local storage, SD card, cloud
- Advanced tagging: ID3v2, Vorbis comments, embedded artwork
- Batch tag editing: rename, retag, reorganize
- Smart playlists by genre, year, BPM, mood, rating
- Manual playlist creation with drag-and-drop
- Folder-based browsing for file-structure users
- Duplicate detection to avoid clutter

### Video Playback (MP4)
- Hardware-accelerated decoding
- Subtitle support: SRT, ASS, embedded subs
- Picture-in-picture mode
- Variable playback speed: 0.5x to 2x with pitch correction
- Frame-by-frame stepping

### User Experience & Interface
- Custom themes / skins
- Lock-screen controls
- Widgets: playback, playlists, search
- Lyrics support: embedded or online lookup
- Bookmarks for long audio/video files
- Sleep timer with fade-out option
- Car mode with simplified large-button UI

### Connectivity & Cloud
- Cloud sync: OneDrive, Google Drive, Dropbox
- DLNA / UPnP streaming from network servers
- Chromecast / AirPlay output
- Bluetooth codec display: LDAC, aptX, AAC
- Podcast support: RSS, auto-download, speed control

### Power User Features
- Audio bookmarks for lectures and audiobooks
- AB repeat: loop between two points
- Waveform view for precision scrubbing
- Tag-based sorting: BPM, composer, conductor, mood
- Statistics: play counts, last played, listening time

---

## 📁 File Structure

```
groove-player/
│
├── index.html          ← App entry point (semantic HTML, player UI)
├── style.css           ← Styles: dark/light theme, responsive, animations
├── app.js              ← Player logic, playlist, PWA install, keyboard shortcuts
├── service-worker.js   ← Offline cache: install / activate / fetch strategies
├── manifest.json       ← PWA manifest (icons, shortcuts, display modes)
│
├── icons/              ← App icons (all sizes: 72 → 512 px)
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-192.png
│   ├── icon-384.png
│   └── icon-512.png    ← Must be "maskable" for Android adaptive icons
│
├── tracks/             ← ★ Place your MP3 files here ★
│   ├── song1.mp3
│   ├── song2.mp3
│   └── ...
│
└── covers/             ← Album art (JPG/PNG, ideally 300×300+)
    ├── cover1.jpg
    └── ...
```

---

## ⚡ Quick Setup

### Step 1 — Add your media

Copy your MP3/MP4 files into the project (or `tracks/`) folder:

```
tracks/
  01-my-song.mp3
  03-my-video.mp4
  02-another-song.mp3
```

### Step 2 — Add cover art (optional)

Copy JPEG/PNG images into `covers/`. Recommended: 300×300 px or larger.

### Step 3 — Update the playlist

Open `app.js` and edit the `PLAYLIST` array near the top:

```js
const PLAYLIST = [
  {
    title:  'My Song Title',
    artist: 'Artist Name',
    album:  'Album Name',          // optional
    src:    'tracks/my-song.mp3',  // relative path to your media
    src480: 'tracks/my-video-480p.mp4', // optional video low-power source
    cover:  'covers/my-art.jpg',   // optional — falls back to app icon
  },
  // Add as many entries as you like...
];
```

### Step 4 — Choose media cache behavior

Open `service-worker.js` and add your tracks to `MUSIC_ASSETS`:

```js
const PRECACHE_MEDIA_ON_INSTALL = false; // set true for full offline library at install time

const MUSIC_ASSETS = [
  '/tracks/my-song.mp3',
  '/tracks/another-song.mp3',
];
```

- With `PRECACHE_MEDIA_ON_INSTALL = false` (default), tracks cache the first time they are played.
- With `PRECACHE_MEDIA_ON_INSTALL = true`, all listed tracks are downloaded at install for immediate offline playback.

### Step 5 — Serve over HTTPS

**Service Workers require HTTPS** (or `localhost` for development).

#### Option A — Local development (Python)
```bash
cd groove-player
python3 -m http.server 8080
# Open http://localhost:8080
```

#### Option B — Local development (Node.js)
```bash
npx serve .
# or
npx http-server -p 8080
```

---

## 🌐 Deployment

### GitHub Pages

1. Push the `groove-player/` contents to a repository.
2. Go to **Settings → Pages → Branch: main / root**.
3. Your app is live at `https://yourusername.github.io/repo-name/`.

> ⚠️ GitHub Pages doesn't serve MP3 with correct MIME types by default.
> Add a `_headers` file or use Netlify instead.

### Netlify (recommended — best MIME support)

1. Drag the `groove-player/` folder onto [netlify.com/drop](https://app.netlify.com/drop).
2. Done! Your app is live with HTTPS and correct headers.

Or via CLI:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir .
```

Create a `netlify.toml` for custom headers:
```toml
[[headers]]
  for = "/*.mp3"
  [headers.values]
    Content-Type = "audio/mpeg"
    Cache-Control = "public, max-age=31536000"
```

### Vercel

```bash
npm install -g vercel
cd groove-player
vercel --prod
```

---

## 📴 Testing Offline Mode

### In Chrome DevTools:

1. Open DevTools → **Application** tab.
2. Confirm Service Worker is registered under **Service Workers**.
3. Check **Cache Storage** — you should see entries like `groove-shell-v1.x.x` and `groove-music-v1.x.x`.
4. Tick **Offline** checkbox in the **Network** tab.
5. Reload the page — the app must still load and play cached tracks.
6. Un-tick **Offline** to restore connectivity.

### Lighthouse PWA Audit:

1. DevTools → **Lighthouse** tab.
2. Select **Progressive Web App** category.
3. Run audit — aim for all green PWA checkmarks.

### Audio controls sanity check:

1. Open the **Equalizer** panel.
2. Confirm mode selector includes **10-band**, **15-band**, **20-band**, and **31-band** options.
3. Move the **Booster** slider (100% to 200%) and confirm the value updates live.
4. Verify **Arrow Up / Arrow Down** nudges booster by 5% while not typing in inputs.

---

## 🎨 Customizing the Theme

All colors are CSS custom properties in `style.css`. Edit the `:root` block for
dark mode and `[data-theme="light"]` for light mode:

```css
:root {
  /* Background shades */
  --bg-base:     #0d0d0d;    /* Page background */
  --bg-surface:  #161616;    /* Card / surface */
  --bg-elevated: #1e1e1e;    /* Elevated elements */

  /* Text */
  --text-primary:   #f0ebe0; /* Headings, main text */
  --text-secondary: #9e9689; /* Supporting text */
  --text-muted:     #5a5650; /* Timestamps, labels */

  /* Accent — the star of the show */
  --accent:     #d4a843;     /* Change this to your brand color */
  --accent-dim: rgba(212,168,67,0.15);
  --accent-glow: rgba(212,168,67,0.35);

  /* Slider colors */
  --slider-fill:  #d4a843;
  --slider-track: #2a2a2a;
  --slider-thumb: #d4a843;
}
```

To switch accent color to, say, teal (`#2dd4bf`), just replace all `#d4a843` / `rgba(212,168,67...)` occurrences.

---

## ⌨️ Keyboard Shortcuts

| Key             | Action                          |
|-----------------|----------------------------------|
| `Space`         | Play / Pause                    |
| `←` / `→`      | Seek ±5 seconds                 |
| `↑` / `↓`      | Volume Booster ±5%             |
| `[` / `]`      | Playback speed ∓5%             |
| `S`             | Toggle Shuffle                  |
| `R`             | Cycle Repeat (Off → All → One)  |
| `N`             | Next track                      |
| `P`             | Previous track                  |
| `F`             | Favorite the current track      |
| `A` / `B`      | Set A/B loop start / end         |
| `L`             | Clear A/B loop                  |
| `/`             | Focus the track search box      |
| `?`             | Toggle the shortcuts dialog     |

---

## 📱 PWA Install

On supported browsers (Chrome, Edge, Safari 17+):

- **Desktop**: An install icon appears in the address bar.
- **Mobile**: An "Add to Home Screen" banner appears.
- **In-app**: An install banner appears 3 seconds after first load.

Once installed:
- Runs in standalone mode (no browser chrome).
- Works fully offline after first visit.
- Appears in your OS app drawer / Start menu.

---

## 🔧 Updating Cached Assets

When you update your CSS/JS/tracks:

1. Open `service-worker.js`.
2. Bump `CACHE_VERSION`:
   ```js
  const CACHE_VERSION = 'v1.0.6'; // was v1.0.5
   ```
3. Deploy. On next visit, the new SW activates and deletes the old cache.

---

## 🛠️ Tech Stack

| Layer         | Technology                                          |
|---------------|------------------------------------------------------|
| Markup        | Semantic HTML5 with ARIA labels                     |
| Styles        | CSS custom properties, Grid, Flexbox, CSS animations |
| Scripts       | Vanilla ES2020+ (classes, async/await, modules)     |
| PWA           | Service Worker (manual cache strategies)             |
| Fonts         | Playfair Display + DM Mono (Google Fonts)           |
| Media Session | Web Media Session API (lock-screen controls)        |
| Icons         | Generated PNG icons (all required sizes)            |

---

## 📋 Browser Support

| Feature          | Chrome | Firefox | Safari | Edge |
|-----------------|--------|---------|--------|------|
| Audio playback   | ✅     | ✅      | ✅     | ✅   |
| Service Worker   | ✅     | ✅      | ✅ 11.1+| ✅  |
| PWA Install      | ✅     | ✅      | ✅ 17+ | ✅   |
| Media Session    | ✅     | ✅      | ✅     | ✅   |
| CSS Grid/Flex    | ✅     | ✅      | ✅     | ✅   |

---

## 💡 Tips

- **Large MP3/MP4 collections**: Remove tracks from `MUSIC_ASSETS` in service-worker.js to skip precaching (they'll still be cached the first time they're played).
- **Battery efficiency for video**: MP4 playback auto-pauses when the tab goes to background to reduce battery drain.
- **Manual mobile battery mode**: Tap the battery icon in the header to force Battery Saver on. Tap again to return to automatic behavior.
- **Automatic 480p switch for MP4**: In Battery Saver mode, the player prefers `src480` for video tracks. If `src480` is not set, it also tries a `-480p` filename pattern automatically (example: `clip.mp4` → `clip-480p.mp4`).
- **Local picker pairing**: If you select both `clip.mp4` and `clip-480p.mp4` in one import, the app pairs them so Battery Saver can use the 480p variant.
- **Auto saver reasons**: Without manual override, saver can auto-enable from reduced-motion preference, data saver, low battery (when Battery API is available), or very slow network.
- **Custom icons**: Replace the files in `icons/` with your own PNG images. Use [maskable.app](https://maskable.app/) to verify your 512px icon looks good as an adaptive icon.
- **FLAC/OGG**: The player supports any format the browser's `<audio>` element supports — just change the `src` extension. Update `isAudioOrCover()` in service-worker.js to include the new extension.
- **Album art from tags**: You can use a tool like [music-metadata](https://github.com/borewit/music-metadata) to extract embedded art from MP3 tags if you want to auto-populate covers.
