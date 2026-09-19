/* ═══════════════════════════════════════════════════
   GROOVE — Music Player Application Logic
   Features: Playback · Playlist · Shuffle · Repeat
             Seek · Volume · Theme · PWA Install
═══════════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════════
   1. PLAYLIST DATA
   ─────────────────────────────────────────────────
   ► Place your MP3 files in the project folder
     (or in a subfolder like "tracks/").
   ► Update cover art paths (optional — uses app icon
     as fallback).
   ► Add / remove objects from this array freely.
════════════════════════════════════════════════ */
const PLAYLIST = [
  {
    title:  'Arctic Snow',
    artist: 'Mathgrant',
    album:  'Single',
    src:    'mathgrant_-_02_-_Arctic_Snow.mp3',
    cover:  'cover.svg',
  },
];

const EQ_MODES = ['off', 'auto', 'three', 'five', 'ten', 'fifteen', 'twenty', 'thirtyone'];
const MANUAL_EQ_MODES = ['three', 'five', 'ten', 'fifteen', 'twenty', 'thirtyone'];

const VOLUME_BOOST_MIN = 100;
const VOLUME_BOOST_MAX = 200;
const VOLUME_BOOST_DEFAULT = 100;

function formatGraphicEqBandLabel(freq) {
  if (freq >= 1000) {
    const normalized = (freq / 1000).toFixed(2).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
    return `${normalized}k`;
  }
  return String(freq).replace(/\.0$/, '');
}

function buildGraphicEqBands(frequencies, q = 1.0) {
  return frequencies.map((freq, index) => {
    const label = formatGraphicEqBandLabel(freq);
    return {
      key: `hz_${label.replace('.', '_')}`,
      label,
      type: index === 0 ? 'lowshelf' : (index === frequencies.length - 1 ? 'highshelf' : 'peaking'),
      freq,
      q: index === 0 || index === frequencies.length - 1 ? 0.7 : q,
    };
  });
}

const EQ_BANDS = {
  three: [
    { key: 'bass',   label: 'Bass',   type: 'lowshelf',  freq: 180,   q: 0.7 },
    { key: 'mid',    label: 'Mid',    type: 'peaking',   freq: 1000,  q: 0.9 },
    { key: 'treble', label: 'Treble', type: 'highshelf', freq: 3600,  q: 0.7 },
  ],
  five: [
    { key: 'low',     label: 'Low',      type: 'lowshelf',  freq: 100,   q: 0.7 },
    { key: 'lowMid',  label: 'Low-Mid',  type: 'peaking',   freq: 320,   q: 1.0 },
    { key: 'mid',     label: 'Mid',      type: 'peaking',   freq: 1000,  q: 1.0 },
    { key: 'highMid', label: 'High-Mid', type: 'peaking',   freq: 3000,  q: 1.0 },
    { key: 'high',    label: 'High',     type: 'highshelf', freq: 9000,  q: 0.7 },
  ],
  ten: [
    { key: '31',    label: '31',   type: 'lowshelf',  freq: 31,    q: 0.7 },
    { key: '62',    label: '62',   type: 'peaking',   freq: 62,    q: 1.0 },
    { key: '125',   label: '125',  type: 'peaking',   freq: 125,   q: 1.0 },
    { key: '250',   label: '250',  type: 'peaking',   freq: 250,   q: 1.0 },
    { key: '500',   label: '500',  type: 'peaking',   freq: 500,   q: 1.0 },
    { key: '1k',    label: '1k',   type: 'peaking',   freq: 1000,  q: 1.0 },
    { key: '2k',    label: '2k',   type: 'peaking',   freq: 2000,  q: 1.0 },
    { key: '4k',    label: '4k',   type: 'peaking',   freq: 4000,  q: 1.0 },
    { key: '8k',    label: '8k',   type: 'peaking',   freq: 8000,  q: 1.0 },
    { key: '16k',   label: '16k',  type: 'highshelf', freq: 16000, q: 0.7 },
  ],
  fifteen: buildGraphicEqBands(
    [25, 40, 63, 100, 160, 250, 400, 630, 1000, 1600, 2500, 4000, 6300, 10000, 16000],
    1.1,
  ),
  twenty: buildGraphicEqBands(
    [31.5, 45, 63, 90, 125, 180, 250, 355, 500, 710, 1000, 1400, 2000, 2800, 4000, 5600, 8000, 11200, 16000, 20000],
    1.2,
  ),
  thirtyone: buildGraphicEqBands(
    [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000],
    1.4,
  ),
};

const AUTO_EQ_FILTER_BANDS = [
  { key: 'bass',   label: 'Bass',   type: 'lowshelf',  freq: 170,  q: 0.7 },
  { key: 'mid',    label: 'Mid',    type: 'peaking',   freq: 1000, q: 0.9 },
  { key: 'treble', label: 'Treble', type: 'highshelf', freq: 3800, q: 0.7 },
];

const AUTO_EQ_ANALYSIS_BANDS = [
  { key: 'bass',   low: 25,   high: 220,   min: -4, max: 4 },
  { key: 'mid',    low: 220,  high: 2400,  min: -3, max: 3 },
  { key: 'treble', low: 2400, high: 12000, min: -4, max: 4 },
];

const AUTO_EQ_PRESET_KEY = 'autoEq';

const EQ_PRESETS = [
  'flat',
  'bassBoost',
  'trebleBoost',
  'vocalBoost',
  'loudness',
  'acoustic',
  'rock',
  'pop',
  'jazz',
  'classical',
  'electronicEdm',
  'hipHop',
  'metal',
  'deepBass',
  'bright',
  'warmTube',
  'podcast',
  'speechClarity',
  'nightMode',
  'carMode',
  'smallSpeakerMode',
  'boosterOff',
  'safeBoost',
  'maxBoost',
  AUTO_EQ_PRESET_KEY,
  'harmonicEnhancer',
];

const EQ_PRESET_LABELS = {
  flat: 'Flat',
  bassBoost: 'Bass Boost',
  trebleBoost: 'Treble Boost',
  vocalBoost: 'Vocal Boost / Clarity',
  loudness: 'Loudness (Smile Curve)',
  acoustic: 'Acoustic',
  rock: 'Rock',
  pop: 'Pop',
  jazz: 'Jazz',
  classical: 'Classical',
  electronicEdm: 'Electronic / EDM',
  hipHop: 'Hip-Hop',
  metal: 'Metal',
  deepBass: 'Deep Bass',
  bright: 'Bright',
  warmTube: 'Warm Tube',
  podcast: 'Podcast',
  speechClarity: 'Speech Clarity',
  nightMode: 'Night Mode',
  carMode: 'Car Mode',
  smallSpeakerMode: 'Small Speaker Mode',
  boosterOff: 'Booster Off (100%)',
  safeBoost: 'Safe Boost',
  maxBoost: 'Max Boost',
  autoEq: 'Auto-EQ (Track Adaptive)',
  harmonicEnhancer: 'Harmonic Enhancer',
};

const EQ_PRESET_ALIASES = {
  vocalClarity: 'vocalBoost',
  vocalBoostClarity: 'vocalBoost',
  auto: AUTO_EQ_PRESET_KEY,
};

const EQ_PRESET_CONFIG = {
  boosterOff: {
    volumeBoost: 100,
    limiterEnabled: false,
    keepCurrentMode: true,
  },
  safeBoost: {
    volumeBoost: 115,
    limiterEnabled: true,
    keepCurrentMode: true,
  },
  maxBoost: {
    volumeBoost: 180,
    limiterEnabled: true,
    keepCurrentMode: true,
  },
  autoEq: {
    mode: 'auto',
  },
  harmonicEnhancer: {
    limiterEnabled: true,
  },
};

const EQ_PRESET_ANCHORS = {
  flat: [
    [31, 0], [62, 0], [125, 0], [250, 0], [500, 0],
    [1000, 0], [2000, 0], [4000, 0], [8000, 0], [16000, 0],
  ],
  bassBoost: [
    [31, 5], [62, 4.5], [125, 3], [250, 1.5], [500, 0.5],
    [1000, -0.5], [2000, -1], [4000, -1], [8000, -0.5], [16000, 0],
  ],
  trebleBoost: [
    [31, -2], [62, -1.5], [125, -1], [250, -0.5], [500, 0],
    [1000, 1], [2000, 2], [4000, 3], [8000, 4], [16000, 4.5],
  ],
  vocalBoost: [
    [31, -3], [62, -2.5], [125, -1.5], [250, -0.5], [500, 1.5],
    [1000, 3], [2000, 3], [4000, 2.5], [8000, 1], [16000, 0],
  ],
  loudness: [
    [31, 4.5], [62, 3.5], [125, 2], [250, 0], [500, -1.5],
    [1000, -2], [2000, -1], [4000, 1], [8000, 2.5], [16000, 3],
  ],
  acoustic: [
    [31, -1], [62, -0.5], [125, 0], [250, 0.5], [500, 1],
    [1000, 1.5], [2000, 1.5], [4000, 1], [8000, 0.5], [16000, 0],
  ],
  rock: [
    [31, 4.5], [62, 3.5], [125, 2], [250, 0], [500, -1],
    [1000, -1.5], [2000, 0.5], [4000, 2], [8000, 3], [16000, 3],
  ],
  pop: [
    [31, 2.5], [62, 2], [125, 1], [250, 0], [500, 0.5],
    [1000, 1], [2000, 1.5], [4000, 2], [8000, 2], [16000, 1.5],
  ],
  jazz: [
    [31, 1.5], [62, 1], [125, 1], [250, 1.5], [500, 2],
    [1000, 1.5], [2000, 1], [4000, 1.5], [8000, 2], [16000, 1],
  ],
  classical: [
    [31, 0.5], [62, 0.5], [125, 0.5], [250, 0], [500, -0.5],
    [1000, 0], [2000, 1], [4000, 1.5], [8000, 2], [16000, 1.5],
  ],
  electronicEdm: [
    [31, 5], [62, 4], [125, 2.5], [250, 1], [500, 0],
    [1000, -0.5], [2000, 1], [4000, 2.5], [8000, 3.5], [16000, 3],
  ],
  hipHop: [
    [31, 5.5], [62, 4.5], [125, 3], [250, 1.5], [500, 0],
    [1000, -0.5], [2000, 0.5], [4000, 1.5], [8000, 1.5], [16000, 1],
  ],
  metal: [
    [31, 3], [62, 2.5], [125, 1.5], [250, 0.5], [500, -0.5],
    [1000, 0], [2000, 2], [4000, 3], [8000, 2.5], [16000, 2],
  ],
  deepBass: [
    [31, 6], [62, 5.5], [125, 4], [250, 2], [500, 0.5],
    [1000, -1], [2000, -1.5], [4000, -1.5], [8000, -1], [16000, -0.5],
  ],
  bright: [
    [31, -2], [62, -1.5], [125, -1], [250, -0.5], [500, 0],
    [1000, 1.5], [2000, 3], [4000, 4], [8000, 4.5], [16000, 4],
  ],
  warmTube: [
    [31, 1.5], [62, 1.5], [125, 1.2], [250, 1], [500, 1],
    [1000, 0.5], [2000, 0], [4000, -0.5], [8000, -1], [16000, -1.5],
  ],
  podcast: [
    [31, -5], [62, -4], [125, -2.5], [250, -1], [500, 1],
    [1000, 2.5], [2000, 3.5], [4000, 2.5], [8000, 1], [16000, -1],
  ],
  speechClarity: [
    [31, -6], [62, -5], [125, -3.5], [250, -1.5], [500, 1],
    [1000, 3], [2000, 4], [4000, 3], [8000, 1.5], [16000, -1],
  ],
  nightMode: [
    [31, -4], [62, -3], [125, -2], [250, -1], [500, 0],
    [1000, 0.5], [2000, 0.5], [4000, -0.5], [8000, -2], [16000, -3.5],
  ],
  carMode: [
    [31, 3], [62, 2.5], [125, 1.5], [250, -0.5], [500, -1.5],
    [1000, 0], [2000, 1.5], [4000, 2], [8000, 1.5], [16000, 0.5],
  ],
  smallSpeakerMode: [
    [31, -8], [62, -5], [125, -2], [250, 0.5], [500, 1.5],
    [1000, 2], [2000, 2], [4000, 1.5], [8000, 0.5], [16000, -1],
  ],
  boosterOff: [
    [31, 0], [62, 0], [125, 0], [250, 0], [500, 0],
    [1000, 0], [2000, 0], [4000, 0], [8000, 0], [16000, 0],
  ],
  safeBoost: [
    [31, 1], [62, 1], [125, 0.5], [250, 0], [500, -0.5],
    [1000, -0.5], [2000, 0.5], [4000, 1], [8000, 1.2], [16000, 1],
  ],
  maxBoost: [
    [31, 2], [62, 2], [125, 1.5], [250, 0.5], [500, -0.5],
    [1000, -1], [2000, 0], [4000, 1.5], [8000, 2], [16000, 2],
  ],
  autoEq: [
    [31, 0], [62, 0], [125, 0], [250, 0], [500, 0],
    [1000, 0], [2000, 0], [4000, 0], [8000, 0], [16000, 0],
  ],
  harmonicEnhancer: [
    [31, -1], [62, -0.5], [125, 0.5], [250, 1], [500, 1],
    [1000, 1.5], [2000, 2.5], [4000, 3.5], [8000, 3], [16000, 2],
  ],
};

const EQ_GAIN_SMOOTH_TIME = 0.02;
const AUTO_EQ_GAIN_SMOOTH_TIME = 0.06;
const AUTO_EQ_INTERVAL_MS = 250;

/* ════════════════════════════════════════════════
   2. DOM REFERENCES
════════════════════════════════════════════════ */
const $ = (id) => document.getElementById(id);

const DOM = {
  // Header
  navToggle:     $('navToggle'),
  powerToggle:   $('powerToggle'),
  powerState:    $('powerState'),
  themeToggle:   $('themeToggle'),
  miniModeToggle:$('miniModeToggle'),
  skinSelect:    $('skinSelect'),
  // Nav Drawer
  navDrawer:     $('navDrawer'),
  navOverlay:    $('navOverlay'),
  navClose:      $('navClose'),
  navOfflineStatus: $('navOfflineStatus'),
  statusDot:     $('statusDot'),
  statusText:    $('statusText'),
  // Vinyl / Art
  vinylDisc:     $('vinylDisc'),
  tonearmWrapper: $('tonearmWrapper'),
  albumArt:      $('albumArt'),
  videoPlayer:   $('videoPlayer'),
  // Metadata
  trackTitle:    $('trackTitle'),
  trackArtist:   $('trackArtist'),
  trackAlbum:    $('trackAlbum'),
  // Seek
  seekBar:       $('seekBar'),
  seekFill:      $('seekFill'),
  currentTime:   $('currentTime'),
  totalDuration: $('totalDuration'),
  waveformCanvas:$('waveformCanvas'),
  // Controls
  playBtn:       $('playBtn'),
  prevBtn:       $('prevBtn'),
  nextBtn:       $('nextBtn'),
  shuffleBtn:    $('shuffleBtn'),
  repeatBtn:     $('repeatBtn'),
  repeatBadge:   $('repeatBadge'),
  // Equalizer
  eqModeSelect:  $('eqModeSelect'),
  eqModeHint:    $('eqModeHint'),
  eqBandContainer:$('eqBandContainer'),
  eqBandTemplate:$('eqBandTemplate'),
  eqAutoStatus:  $('eqAutoStatus'),
  eqPresetSelect:$('eqPresetSelect'),
  eqCurveRow:    $('eqCurveRow'),
  eqCurvePath:   $('eqCurvePath'),
  eqResetBtn:    $('eqResetBtn'),
  boosterBar:    $('boosterBar'),
  boosterFill:   $('boosterFill'),
  boosterValue:  $('boosterValue'),
  eqLimiterToggle:$('eqLimiterToggle'),
  // Volume + mute
  muteBtn:       $('muteBtn'),
  volumeBar:     $('volumeBar'),
  volumeFill:    $('volumeFill'),
  volumeValue:   $('volumeValue'),
  // Favorite / speed / A-B loop
  favoriteBtn:   $('favoriteBtn'),
  speedBar:      $('speedBar'),
  speedValue:    $('speedValue'),
  loopSetA:      $('loopSetA'),
  loopSetB:      $('loopSetB'),
  loopClear:     $('loopClear'),
  seekLoopRegion:$('seekLoopRegion'),
  // Sleep timer
  sleepTimerOptions: $('sleepTimerOptions'),
  sleepRemaining:$('sleepRemaining'),
  // Shortcuts modal
  shortcutsBtn:    $('shortcutsBtn'),
  shortcutsOverlay:$('shortcutsOverlay'),
  shortcutsModal:  $('shortcutsModal'),
  shortcutsClose:  $('shortcutsClose'),
  // Preamp
  preampBar:    $('preampBar'),
  preampFill:   $('preampFill'),
  preampValue:  $('preampValue'),
  // Parametric EQ
  peqToggle:    $('peqToggle'),
  peqBands:     $('peqBands'),
  peqBandTemplate: $('peqBandTemplate'),
  // Crossfeed
  crossfeedToggle: $('crossfeedToggle'),
  crossfeedBar:    $('crossfeedBar'),
  crossfeedValue:  $('crossfeedValue'),
  // Convolution
  convolverToggle: $('convolverToggle'),
  convolverSpace:  $('convolverSpace'),
  convolverCustomOption: $('convolverCustomOption'),
  convolverLoadBtn: $('convolverLoadBtn'),
  convolverFilePicker: $('convolverFilePicker'),
  convolverMixBar: $('convolverMixBar'),
  convolverMixValue: $('convolverMixValue'),
  // Loudness normalization
  loudnessToggle: $('loudnessToggle'),
  // Gapless
  gaplessToggle: $('gaplessToggle'),
  // ABX
  abxStartBtn:   $('abxStartBtn'),
  abxChoices:    $('abxChoices'),
  abxPlayXBtn:   $('abxPlayXBtn'),
  abxGuessABtn:  $('abxGuessABtn'),
  abxGuessBBtn:  $('abxGuessBBtn'),
  abxStatus:     $('abxStatus'),
  abxScore:      $('abxScore'),
  // Visualizer mode + clip indicator
  vizWaveBtn:     $('vizWaveBtn'),
  vizSpectrumBtn: $('vizSpectrumBtn'),
  clipIndicator:  $('clipIndicator'),
  // Bookmarks
  bookmarkAddBtn: $('bookmarkAddBtn'),
  bookmarksList:  $('bookmarksList'),
  // Picture-in-picture
  pipBtn: $('pipBtn'),
  // Playlist + search
  trackList:     $('trackList'),
  playlistCount: $('playlistCount'),
  addTracksBtn:  $('addTracksBtn'),
  filePicker:    $('filePicker'),
  dropZone:      $('dropZone'),
  trackSearch:   $('trackSearch'),
  favFilterBtn:  $('favFilterBtn'),
  // Install
  installBanner: $('installBanner'),
  installAccept: $('installAccept'),
  installDismiss:$('installDismiss'),
  // Toast
  toast:         $('toast'),
  toastIcon:     $('toastIcon'),
  toastMsg:      $('toastMsg'),
  // Mini player
  miniPlayer:    $('miniPlayer'),
  miniExpandBtn: $('miniExpandBtn'),
  miniTrackTitle:$('miniTrackTitle'),
  miniTrackArtist:$('miniTrackArtist'),
  miniPrevBtn:   $('miniPrevBtn'),
  miniPlayBtn:   $('miniPlayBtn'),
  miniNextBtn:   $('miniNextBtn'),
};

/* ════════════════════════════════════════════════
   3. MUSIC PLAYER CLASS
════════════════════════════════════════════════ */
class GroovePlayer {
  constructor(playlist) {
    this.playlist      = playlist;
    this.audio         = new Audio();
    this.audio.preload = 'metadata';
    this.video         = DOM.videoPlayer;
    this.media         = this.audio;
    this._isVideoTrack = false;
    this.currentIndex  = 0;
    this.isPlaying     = false;
    this.shuffleMode   = false;
    this.repeatMode    = 'none';  // 'none' | 'all' | 'one'
    this.shuffleQueue  = [];
    this.shufflePos    = 0;
    this.deferredPrompt = null;
    this._toastTimer   = null;
    this._installBannerTimer = null;
    this._seekDragging = false;
    this._seekRaf      = null;
    this._lastSeekPaint = 0;
    this._seekPaintInterval = 250;
    this._isLikelyMobile = window.matchMedia('(pointer: coarse)').matches;
    this._isPageVisible = !document.hidden;
    this._powerSaveMode = false;
    this._powerSaveOverride = this.loadPowerSaveOverride();
    this._syncPowerSave = null;
    this._batteryLow = false;
    this._slowNetwork = false;
    this._trackLoadToken = 0;
    this._sourceFallbackAttempted = false;
    this._using480pVideo = false;
    this._autoPlayRequested = false;
    this._autoPausedVideoForHidden = false;
    this._objectUrls = new Set();
    this._audioContextClass = window.AudioContext || window.webkitAudioContext;
    this._audioCtx = null;
    this._inputNode = null;
    this._outputGain = null;
    this._audioGraphConnected = false;
    this._limiter = null;
    this._analysisAnalyser = null;
    this._mediaSourceNodes = new WeakMap();
    this._eqFilterChains = new Map();
    this._analyser = null;
    this._autoEqFreqData = null;
    this._autoEqRaf = null;
    this._autoEqLastTick = 0;
    this._autoEqGains = { bass: 0, mid: 0, treble: 0 };
    this._waveformData = null;
    this._waveformCtx = null;
    this._waveformRaf = null;
    this._waveformResizeHandler = null;
    this._eqState = this.loadEqualizerState();
    this._eqMode = this._eqState.mode;
    this._eqValues = this._eqState.values;
    this._eqPreset = this._eqState.preset;
    this._limiterEnabled = this._eqState.limiterEnabled;
    this._volumeBoost = this._eqState.volumeBoost;
    this._lastManualEqMode = this._eqState.lastManualMode;
    this._skin = this.loadSkin();
    this._miniPlayerMode = this.loadMiniPlayerMode();

    // Volume + mute
    this._volume = this._loadVolume();
    this._muted   = false;

    // Favorites + search
    this._favorites   = this.loadFavorites();
    this._searchQuery = '';
    this._favOnly     = false;

    // Playback speed
    this._speed = this.loadSpeed();

    // A/B loop
    this._loopA = null;
    this._loopB = null;

    // Sleep timer
    this._sleepEndAt       = null;
    this._sleepAtTrackEnd  = false;
    this._sleepInterval    = null;
    this._sleepFadeFactor  = 1;
    this._sleepFadeMs      = 20000;
    this._sleepSelectedValue = '0';

    // Preamp / loudness
    this._preampDb         = this.loadPreampDb();
    this._loudnessEnabled  = localStorage.getItem('groove-loudness-on') === '1';
    this._replayGainDb     = this.loadReplayGainDb();
    this._rgRunningLevel   = null;
    this._rgSampleBuf      = null;

    // Parametric EQ
    this._peqEnabled = localStorage.getItem('groove-peq-on') === '1';
    this._peqBands   = this.loadPeqBands();
    this._peqFilters = null;

    // Crossfeed
    this._crossfeedEnabled = localStorage.getItem('groove-crossfeed-on') === '1';
    this._crossfeedAmount  = this.loadCrossfeedAmount();
    this._crossfeedNodes   = null;

    // Convolution DSP
    this._convolverEnabled = localStorage.getItem('groove-convolver-on') === '1';
    this._convolverSpace   = localStorage.getItem('groove-convolver-space') || 'smallRoom';
    this._convolverMix     = this.loadConvolverMix();
    this._convolverNodes   = null;
    this._convolverCustomBuffer = null;

    // Gapless
    this._gaplessEnabled    = localStorage.getItem('groove-gapless-off') !== '1';
    this._preloadedNextSrc  = null;
    this._preloadedNextEl   = null;

    // Per-track DSP profiles
    this._trackDspProfiles          = this.loadTrackDspProfiles();
    this._suppressDspProfileCapture = false;

    // Bookmarks
    this._bookmarks = this.loadBookmarks();

    // ABX blind test
    this._abx = { active: false, x: null, currentlyBypassed: null, score: { correct: 0, total: 0 } };
    this._mediaSessionPosInterval = null;
    this._dspBypassed = false;

    // Viz mode + clipping
    this._vizMode       = localStorage.getItem('groove-viz-mode') || 'wave';
    this._spectrumFreqData = null;
    this._clipUntil     = 0;
    this._cachedAccent  = null;

    if (this.video) {
      this.video.preload = 'metadata';
      this.video.playsInline = true;
      this.video.disablePictureInPicture = true;
      this.video.controls = false;
    }

    this.init();
  }

  /* ─── init ─────────────────────────────────── */
  init() {
    this.loadTheme();
    this.applySkin(this._skin, false);
    this.setupAudioGraph();
    this.setupWaveformCanvas();
    this.configureRuntimeEfficiency();
    this.renderPlaylist();
    this.buildShuffleQueue();
    this.bindMediaEvents();
    this.bindUIEvents();
    this.bindDragAndDrop();
    this.bindExtraFeatures();
    this.bindNetworkEvents();
    this.bindInstallPrompt();
    this.registerServiceWorker();
    this.setMiniPlayerMode(this._miniPlayerMode, false);

    // Volume + mute
    this._applyVolumeSlider(this._volume, false);
    this.applyVolumeAndMute();
    this.renderEqualizerUI();
    this.setEqualizerMode(this._eqMode, false, false);
    this.applyPreset(this._eqPreset, false, false, false);
    this.applySpeed(this._speed, false);
    this.resumeSleepTimerFromStorage();

    // DSP stages
    this._suppressDspProfileCapture = true;
    this.setPreampDb(this._preampDb, false);
    this.renderPeqBandsUI();
    this.setPeqEnabled(this._peqEnabled, false);
    this.setCrossfeedAmount(this._crossfeedAmount, false);
    this.setCrossfeedEnabled(this._crossfeedEnabled, false);
    this.setConvolverMix(this._convolverMix, false);
    if (DOM.convolverSpace) DOM.convolverSpace.value = this._convolverSpace;
    this.setConvolverEnabled(this._convolverEnabled, false);
    this._suppressDspProfileCapture = false;
    this.setLoudnessEnabled(this._loudnessEnabled, false);
    this.setGaplessEnabled(this._gaplessEnabled, false);
    this.setVizMode(this._vizMode);

    // Resume last session
    const resume = this.loadResumeState();
    this.loadTrack(resume.index, false, resume.time);
  }

  /* ════════════════════════════════════════════
     TRACK LOADING
  ════════════════════════════════════════════ */
  loadTrack(index, autoPlay = false, startTime = 0) {
    const track = this.playlist[index];
    if (!track) return;

    this.currentIndex = index;
    this._autoPlayRequested = autoPlay;
    const loadToken = ++this._trackLoadToken;

    const mediaType = this.getTrackMediaType(track);
    this._isVideoTrack = mediaType === 'video' && Boolean(this.video);
    this.media = this._isVideoTrack ? this.video : this.audio;

    const sourceChoice = this.pickTrackSource(track);
    this._using480pVideo = sourceChoice.using480p;
    this._sourceFallbackAttempted = false;

    // Stop all media before switching source.
    this.stopAndResetMedia(this.audio, this.media !== this.audio);
    this.stopAndResetMedia(this.video, this.media !== this.video);

    this.media.src = sourceChoice.src;
    this.applyVolumeAndMute();
    this.media.load();
    this.setVideoState(this._isVideoTrack);

    if (startTime > 0) {
      const mediaRef = this.media;
      const resumeAt = () => {
        if (loadToken !== this._trackLoadToken || this.media !== mediaRef) return;
        const seekTime = Math.min(startTime, mediaRef.duration || startTime);
        if (isFinite(seekTime) && seekTime > 0) {
          mediaRef.currentTime = seekTime;
        }
      };

      if (mediaRef.readyState >= 1) {
        resumeAt();
      } else {
        mediaRef.addEventListener('loadedmetadata', resumeAt, { once: true });
      }
    }

    // Update UI
    this.animateMetaChange(() => {
      DOM.trackTitle.textContent  = track.title;
      DOM.trackArtist.textContent = track.artist;
      DOM.trackAlbum.textContent  = track.album || '';
    });
    this.updateMiniMeta(track);

    // Album art
    const art = DOM.albumArt;
    art.src = track.cover || 'icons/icon-192.png';
    art.alt = `${track.title} album art`;
    art.onerror = () => { art.src = 'icons/icon-192.png'; };

    // Seek reset
    DOM.seekBar.value = 0;
    DOM.seekFill.style.width = '0%';
    DOM.currentTime.textContent = '0:00';
    DOM.totalDuration.textContent = '0:00';
    DOM.seekBar.setAttribute('aria-valuenow', 0);
    DOM.seekBar.setAttribute('aria-valuetext', '0:00 of 0:00');

    // Vinyl stop spin while loading
    this.syncVisualState();
    this.highlightActiveTrack();
    this.updatePowerToggleUI();
    this.updateMediaSession(track);

    if (autoPlay) {
      this.play();
    } else {
      this.updatePlayBtn(false);
    }
  }

  /* ─── Play ──────────────────────────────────── */
  play() {
    const startPlayback = () => {
      const p = this.media.play();
      if (p instanceof Promise) {
        p.catch((err) => {
          // Autoplay blocked: show toast
          if (err.name === 'NotAllowedError') {
            this.showToast('Tap play to start', '▶');
          }
        });
      }
    };

    this.ensureAudioContextRunning()
      .catch(() => {
        // Keep direct media playback path available if context resume fails.
      })
      .finally(startPlayback);
  }

  /* ─── Toggle play/pause ─────────────────────── */
  togglePlay() {
    if (this.media.paused) {
      this.play();
    } else {
      this.media.pause();
    }
  }

  /* ─── Previous track ────────────────────────── */
  prev() {
    // If more than 3s in, restart current track
    if (this.media.currentTime > 3) {
      this.media.currentTime = 0;
      return;
    }
    if (this.shuffleMode) {
      this.shufflePos = Math.max(0, this.shufflePos - 1);
      this.loadTrack(this.shuffleQueue[this.shufflePos], true);
    } else {
      const prev = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
      this.loadTrack(prev, this.isPlaying);
    }
  }

  /* ─── Next track ────────────────────────────── */
  next(fromEnd = false) {
    if (this.repeatMode === 'one' && fromEnd) {
      this.media.currentTime = 0;
      this.play();
      return;
    }
    if (this.shuffleMode) {
      this.shufflePos++;
      if (this.shufflePos >= this.shuffleQueue.length) {
        this.buildShuffleQueue();
        this.shufflePos = 0;
      }
      this.loadTrack(this.shuffleQueue[this.shufflePos], this.isPlaying || fromEnd);
    } else {
      const isLast = this.currentIndex === this.playlist.length - 1;
      if (isLast && this.repeatMode === 'none' && fromEnd) {
        this.media.pause();
        this.media.currentTime = 0;
        this.isPlaying = false;
        this.syncVisualState();
        this.updatePlayBtn(false);
        return;
      }
      const next = (this.currentIndex + 1) % this.playlist.length;
      this.loadTrack(next, this.isPlaying || fromEnd);
    }
  }

  /* ─── Shuffle queue builder ─────────────────── */
  buildShuffleQueue() {
    const indices = this.playlist.map((_, i) => i);
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    this.shuffleQueue = indices;
    this.shufflePos   = 0;
  }

  /* ─── Toggle shuffle ────────────────────────── */
  toggleShuffle() {
    this.shuffleMode = !this.shuffleMode;
    if (this.shuffleMode) this.buildShuffleQueue();
    DOM.shuffleBtn.classList.toggle('is-active', this.shuffleMode);
    DOM.shuffleBtn.setAttribute('aria-pressed', String(this.shuffleMode));
    this.showToast(this.shuffleMode ? 'Shuffle on' : 'Shuffle off', '🔀');
  }

  /* ─── Toggle repeat ─────────────────────────── */
  toggleRepeat() {
    const modes = ['none', 'all', 'one'];
    const idx = modes.indexOf(this.repeatMode);
    this.repeatMode = modes[(idx + 1) % modes.length];

    const labels = { none: 'Repeat: Off', all: 'Repeat: All', one: 'Repeat: One' };
    const toasts  = { none: 'Repeat off', all: 'Repeat all', one: 'Repeat one' };

    DOM.repeatBtn.setAttribute('data-mode', this.repeatMode);
    DOM.repeatBtn.setAttribute('title', labels[this.repeatMode]);
    DOM.repeatBtn.setAttribute('aria-pressed', String(this.repeatMode !== 'none'));
    DOM.repeatBtn.classList.toggle('is-active', this.repeatMode !== 'none');

    // Badge shows '1' for repeat-one
    if (this.repeatMode === 'one') {
      DOM.repeatBadge.textContent = '1';
      DOM.repeatBadge.removeAttribute('hidden');
    } else {
      DOM.repeatBadge.setAttribute('hidden', '');
    }

    this.showToast(toasts[this.repeatMode], '🔁');
  }

  clampVolumeBoost(value, max = VOLUME_BOOST_MAX) {
    const parsed = Number(value);
    if (!isFinite(parsed)) return VOLUME_BOOST_DEFAULT;
    return Math.max(VOLUME_BOOST_MIN, Math.min(max, Math.round(parsed)));
  }

  getVolumeBoostGain(value = this._volumeBoost) {
    return this.clampVolumeBoost(value) / 100;
  }

  getVolumeBoostFill(value = this._volumeBoost) {
    return this.clampVolumeBoost(value) - VOLUME_BOOST_MIN;
  }

  renderVolumeBoosterUI() {
    const boost = this.clampVolumeBoost(this._volumeBoost);
    const fill = this.getVolumeBoostFill(boost);

    if (DOM.boosterBar) {
      DOM.boosterBar.value = String(boost);
      DOM.boosterBar.setAttribute('aria-valuenow', String(boost));
      DOM.boosterBar.setAttribute('aria-valuetext', `${boost}% output level`);
      DOM.boosterBar.setAttribute('title', `Volume Booster ${boost}%`);
      DOM.boosterBar.disabled = !this._audioCtx;
    }

    if (DOM.boosterFill) {
      DOM.boosterFill.style.width = `${fill}%`;
    }

    if (DOM.boosterValue) {
      DOM.boosterValue.textContent = `${boost}%`;
      DOM.boosterValue.title = this._audioCtx
        ? `Volume Booster ${boost}%`
        : 'Booster above 100% requires Web Audio support';
    }
  }

  setVolumeBoost(value, persist = true, notify = false) {
    const max = this._audioCtx ? VOLUME_BOOST_MAX : 100;
    const next = this.clampVolumeBoost(value, max);
    this._volumeBoost = next;
    this.applyVolumeAndMute();

    if (persist) {
      this.saveEqualizerState();
    }

    if (notify) {
      this.showToast(`Booster ${next}%`, '🔊');
    }
  }

  nudgeVolumeBoost(delta) {
    if (!this._audioCtx) {
      this.showToast('Booster above 100% needs Web Audio support', '⚠');
      return;
    }
    this.setVolumeBoost(this._volumeBoost + delta, true, true);
  }

  applyVolumeAndMute() {
    const boost = this.clampVolumeBoost(this._volumeBoost);
    const fade = typeof this._sleepFadeFactor === 'number' ? this._sleepFadeFactor : 1;
    const vol = this._muted ? 0 : Math.max(0, Math.min(100, this._volume ?? 100));
    const volFraction = vol / 100;
    const fallbackGain = Math.min(1, this.getVolumeBoostGain(boost)) * volFraction * fade;

    [this.audio, this.video].forEach((media) => {
      if (!media) return;
      media.volume = fallbackGain;
      media.muted  = false;
    });

    if (this._audioCtx && this._outputGain) {
      const now = this._audioCtx.currentTime;
      this._outputGain.gain.setTargetAtTime(
        this.getVolumeBoostGain(boost) * volFraction * fade, now, 0.02);
    }

    this.renderVolumeBoosterUI();
  }

  setupAudioGraph() {
    if (!this._audioContextClass) return;

    try {
      this._audioCtx = new this._audioContextClass();

      this._inputNode = this._audioCtx.createGain();
      this._outputGain = this._audioCtx.createGain();

      this._limiter = this._audioCtx.createDynamicsCompressor();
      this._limiter.threshold.value = -1.5;
      this._limiter.knee.value = 0;
      this._limiter.ratio.value = 20;
      this._limiter.attack.value = 0.003;
      this._limiter.release.value = 0.08;

      this._analysisAnalyser = this._audioCtx.createAnalyser();
      this._analysisAnalyser.fftSize = 1024;
      this._analysisAnalyser.smoothingTimeConstant = 0.82;

      this._analyser = this._audioCtx.createAnalyser();
      this._analyser.fftSize = 2048;
      this._analyser.smoothingTimeConstant = 0.78;
      this._waveformData = new Uint8Array(this._analyser.fftSize);

      this._autoEqFreqData = new Uint8Array(this._analysisAnalyser.frequencyBinCount);
      this._outputGain.connect(this._audioCtx.destination);

      this._outputGain.gain.value = this.getVolumeBoostGain();
      // Keep default media output path until context is running.
      if (this._audioCtx.state === 'running') {
        this.attachMediaGraph();
      }
    } catch (err) {
      this._audioCtx = null;
      this._inputNode = null;
      this._outputGain = null;
      this._audioGraphConnected = false;
      this._limiter = null;
      this._analysisAnalyser = null;
      this._analyser = null;
      this._autoEqFreqData = null;
      console.warn('[Groove] Web Audio API unavailable:', err);
    }
  }

  connectMediaElementToAudioGraph(media) {
    if (!media || !this._audioCtx || !this._inputNode) return;
    if (this._mediaSourceNodes.has(media)) return;
    // file:// URLs are treated as unique opaque origins by Chrome/Edge.
    // createMediaElementSource outputs zeroes (CORS block). Skip the graph
    // on file:// — audio plays via media.volume. Run via Start Groove.bat
    // (http://localhost:3000) to get full EQ/DSP.
    if (location.protocol === 'file:') return;

    try {
      const sourceNode = this._audioCtx.createMediaElementSource(media);
      sourceNode.connect(this._inputNode);
      this._mediaSourceNodes.set(media, sourceNode);
    } catch (err) {
      console.warn('[Groove] Could not attach media node to audio graph:', err);
    }
  }

  attachMediaGraph() {
    if (!this._audioCtx || !this._inputNode) return;
    if (this._audioGraphConnected) return;

    this.connectMediaElementToAudioGraph(this.audio);
    this.connectMediaElementToAudioGraph(this.video);

    const hasAudioNode = this._mediaSourceNodes.has(this.audio);
    const hasVideoNode = this.video ? this._mediaSourceNodes.has(this.video) : false;

    if (!hasAudioNode && !hasVideoNode) {
      return;
    }

    this._audioGraphConnected = true;
    this.rebuildEqualizerRouting();
    this.applyVolumeAndMute();
  }

  ensureAudioContextRunning() {
    if (!this._audioCtx) return Promise.resolve(false);

    if (this._audioCtx.state === 'running') {
      this.attachMediaGraph();
      return Promise.resolve(true);
    }

    return this._audioCtx.resume().then(() => {
      this.attachMediaGraph();
      return true;
    }).catch(() => {
      // User gesture may still be required in some browsers.
      this.showToast('Advanced EQ unavailable, using direct playback', '⚠');
      return false;
    });
  }

  setupWaveformCanvas() {
    if (!DOM.waveformCanvas) return;
    this._waveformCtx = DOM.waveformCanvas.getContext('2d');
    if (!this._waveformCtx) return;

    this._waveformResizeHandler = () => {
      this.resizeWaveformCanvas();
      if (!this._waveformRaf) this.drawWaveformFrame(true);
    };

    this.resizeWaveformCanvas();
    window.addEventListener('resize', this._waveformResizeHandler, { passive: true });
    this.drawWaveformFrame(true);
  }

  resizeWaveformCanvas() {
    if (!DOM.waveformCanvas) return;
    const rect = DOM.waveformCanvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));

    if (DOM.waveformCanvas.width !== width || DOM.waveformCanvas.height !== height) {
      DOM.waveformCanvas.width = width;
      DOM.waveformCanvas.height = height;
    }
  }

  syncWaveformState() {
    const shouldAnimate = Boolean(
      this._analyser
      && this._waveformCtx
      && this.isPlaying
      && this._isPageVisible
      && !this._powerSaveMode
    );

    if (shouldAnimate) {
      this.startWaveformLoop();
    } else {
      this.stopWaveformLoop();
    }
  }

  startWaveformLoop() {
    if (this._waveformRaf) return;

    const paint = () => {
      this._waveformRaf = requestAnimationFrame(paint);
      this.drawWaveformFrame(false);
    };

    paint();
  }

  stopWaveformLoop() {
    if (this._waveformRaf) {
      cancelAnimationFrame(this._waveformRaf);
      this._waveformRaf = null;
    }
    this.drawWaveformFrame(true);
  }

  drawWaveformFrame(idle = false) {
    if (!DOM.waveformCanvas || !this._waveformCtx) return;

    const ctx = this._waveformCtx;
    const width = DOM.waveformCanvas.width;
    const height = DOM.waveformCanvas.height;
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#d4a843';
    const midY = height / 2;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(160, 160, 160, 0.35)';
    ctx.lineWidth = Math.max(1, Math.floor((window.devicePixelRatio || 1)));
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();

    if (idle || !this._analyser || !this._waveformData) return;

    this._analyser.getByteTimeDomainData(this._waveformData);
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(1.6, (window.devicePixelRatio || 1));
    ctx.beginPath();

    const len = this._waveformData.length;
    for (let i = 0; i < len; i++) {
      const x = (i / (len - 1)) * width;
      const centered = (this._waveformData[i] - 128) / 128;
      const y = midY + centered * (height * 0.34);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  loadEqualizerState() {
    const defaultValues = this.buildDefaultEqValues();
    const defaults = {
      mode: 'off',
      values: defaultValues,
      preset: 'flat',
      limiterEnabled: false,
      volumeBoost: VOLUME_BOOST_DEFAULT,
      lastManualMode: 'ten',
    };

    try {
      const parsed = JSON.parse(localStorage.getItem('groove-eq-v2') || '{}');
      const mode = this.normalizeEqMode(parsed.mode);
      const values = this.cloneEqValues(defaultValues);

      MANUAL_EQ_MODES.forEach((eqMode) => {
        const source = parsed.values && parsed.values[eqMode] ? parsed.values[eqMode] : {};
        this.getEqualizerBandsForMode(eqMode).forEach((band) => {
          const rawValue = source[band.key] !== undefined
            ? source[band.key]
            : (band.defaultGain !== undefined ? band.defaultGain : 0);
          values[eqMode][band.key] = this.clampEqValue(
            rawValue,
            band.min ?? -12,
            band.max ?? 12,
          );
        });
      });

      const preset = this.normalizePresetKey(parsed.preset);
      const limiterEnabled = Boolean(parsed.limiterEnabled);
      const volumeBoost = this.clampVolumeBoost(parsed.volumeBoost);
      const lastManualSeed = parsed.lastManualMode !== undefined ? parsed.lastManualMode : mode;
      const lastManualMode = this.normalizeManualEqMode(lastManualSeed);

      return { mode, values, preset, limiterEnabled, volumeBoost, lastManualMode };
    } catch {
      return defaults;
    }
  }

  buildDefaultEqValues() {
    const values = {};
    MANUAL_EQ_MODES.forEach((mode) => {
      values[mode] = {};
      this.getEqualizerBandsForMode(mode).forEach((band) => {
        values[mode][band.key] = this.clampEqValue(
          band.defaultGain !== undefined ? band.defaultGain : 0,
          band.min ?? -12,
          band.max ?? 12,
        );
      });
    });
    return values;
  }

  cloneEqValues(values) {
    return JSON.parse(JSON.stringify(values || this.buildDefaultEqValues()));
  }

  normalizeEqMode(mode) {
    return EQ_MODES.includes(mode) ? mode : 'off';
  }

  normalizeManualEqMode(mode) {
    return MANUAL_EQ_MODES.includes(mode) ? mode : 'ten';
  }

  normalizePresetKey(preset) {
    const canonical = EQ_PRESET_ALIASES[preset] || preset;
    return EQ_PRESETS.includes(canonical) ? canonical : 'flat';
  }

  getEqualizerBandsForMode(mode) {
    return EQ_BANDS[mode] || [];
  }

  isManualEqMode(mode) {
    return MANUAL_EQ_MODES.includes(mode);
  }

  clampEqValue(value, min = -12, max = 12) {
    const n = Number(value);
    if (!isFinite(n)) return 0;
    return Math.max(min, Math.min(max, Math.round(n * 10) / 10));
  }

  saveEqualizerState() {
    localStorage.setItem('groove-eq-v2', JSON.stringify({
      mode: this._eqMode,
      values: this._eqValues,
      preset: this._eqPreset,
      limiterEnabled: this._limiterEnabled,
      volumeBoost: this._volumeBoost,
      lastManualMode: this._lastManualEqMode,
    }));
  }

  formatEqValue(value) {
    const v = this.clampEqValue(value);
    return `${v > 0 ? '+' : ''}${v.toFixed(1).replace(/\.0$/, '')} dB`;
  }

  describeEqMode(mode) {
    const labels = {
      off: 'Off',
      auto: 'Auto',
      three: '3-band',
      five: '5-band',
      ten: '10-band',
      fifteen: '15-band',
      twenty: '20-band',
      thirtyone: '31-band',
    };
    return labels[mode] || 'Off';
  }

  describeEqPreset(preset) {
    return EQ_PRESET_LABELS[preset] || EQ_PRESET_LABELS.flat;
  }

  getEqModeHint(mode) {
    if (mode === 'off') {
      return 'Equalizer bypassed for maximum battery life.';
    }
    if (mode === 'auto') {
      if (this._eqPreset === AUTO_EQ_PRESET_KEY) {
        return 'Auto-EQ preset active: track-adaptive balancing in real time.';
      }
      return 'Auto EQ runs lightweight FFT analysis at 4 updates per second.';
    }
    return `${this.describeEqMode(mode)} active · Preset ${this.describeEqPreset(this._eqPreset)}.`;
  }

  getPreferredManualEqMode() {
    return this.normalizeManualEqMode(this._lastManualEqMode);
  }

  getPresetConfig(preset) {
    return EQ_PRESET_CONFIG[preset] || null;
  }

  getBandDefinition(mode, bandKey) {
    return this.getEqualizerBandsForMode(mode).find((band) => band.key === bandKey) || null;
  }

  getPresetAnchors(preset) {
    return EQ_PRESET_ANCHORS[preset] || EQ_PRESET_ANCHORS.flat;
  }

  interpolatePresetGain(anchors, freq) {
    if (!anchors || !anchors.length) return 0;
    if (freq <= anchors[0][0]) return anchors[0][1];
    if (freq >= anchors[anchors.length - 1][0]) return anchors[anchors.length - 1][1];

    for (let i = 0; i < anchors.length - 1; i++) {
      const [f1, g1] = anchors[i];
      const [f2, g2] = anchors[i + 1];
      if (freq >= f1 && freq <= f2) {
        const t = (freq - f1) / (f2 - f1);
        return g1 + (g2 - g1) * t;
      }
    }

    return 0;
  }

  buildPresetValuesForMode(mode, preset) {
    const anchors = this.getPresetAnchors(preset);
    const values = {};
    this.getEqualizerBandsForMode(mode).forEach((band) => {
      values[band.key] = this.clampEqValue(this.interpolatePresetGain(anchors, band.freq), -12, 12);
    });
    return values;
  }

  renderEqualizerUI() {
    if (DOM.eqModeSelect) {
      DOM.eqModeSelect.value = this._eqMode;
    }

    if (DOM.eqPresetSelect) {
      DOM.eqPresetSelect.value = this._eqPreset;
    }

    if (DOM.eqLimiterToggle) {
      DOM.eqLimiterToggle.checked = Boolean(this._limiterEnabled);
    }

    this.renderVolumeBoosterUI();

    if (DOM.eqModeHint) {
      DOM.eqModeHint.textContent = this.getEqModeHint(this._eqMode);
    }

    if (DOM.eqAutoStatus) {
      DOM.eqAutoStatus.hidden = this._eqMode !== 'auto';
      if (this._eqMode === 'auto') {
        DOM.eqAutoStatus.textContent = 'Auto EQ is analyzing spectrum...';
      }
    }

    if (!DOM.eqBandContainer) return;

    DOM.eqBandContainer.innerHTML = '';
    const bands = this.isManualEqMode(this._eqMode) ? this.getEqualizerBandsForMode(this._eqMode) : [];
    DOM.eqBandContainer.setAttribute('data-band-count', String(bands.length));

    if (!bands.length) {
      if (DOM.eqCurveRow) DOM.eqCurveRow.hidden = true;
      return;
    }

    bands.forEach((band) => {
      const control = this.createEqBandControl(band, this._eqMode);
      DOM.eqBandContainer.appendChild(control);
    });

    if (DOM.eqCurveRow) DOM.eqCurveRow.hidden = false;
    this.drawEqCurve();
  }

  drawEqCurve() {
    if (!DOM.eqCurvePath) return;
    const bands = this.isManualEqMode(this._eqMode) ? this.getEqualizerBandsForMode(this._eqMode) : [];
    if (!bands.length) { DOM.eqCurvePath.setAttribute('d', ''); return; }

    const W = 600, H = 60, mid = H / 2;
    // map gain → y: +12dB = top, -12dB = bottom
    const gainToY = (g) => mid - (g / 12) * (mid - 4);
    const step = W / (bands.length - 1 || 1);

    const points = bands.map((band, i) => {
      const gain = (this._eqValues[this._eqMode] && this._eqValues[this._eqMode][band.key] !== undefined)
        ? this._eqValues[this._eqMode][band.key]
        : 0;
      return [i * step, gainToY(gain)];
    });

    // smooth catmull-rom spline
    let d = `M ${points[0][0]},${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
      const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
      const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
      const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
    }
    DOM.eqCurvePath.setAttribute('d', d);
  }

  zeroAllEqBands() {
    const bands = this.getEqualizerBandsForMode(this._eqMode);
    bands.forEach((band) => {
      this._eqValues[this._eqMode][band.key] = 0;
    });
    this.saveEqualizerState();
    this.renderEqualizerUI();
    this.applyManualEqGains();
  }

  createEqBandControl(band, mode) {
    let control = null;
    if (DOM.eqBandTemplate && DOM.eqBandTemplate.content && DOM.eqBandTemplate.content.firstElementChild) {
      control = DOM.eqBandTemplate.content.firstElementChild.cloneNode(true);
    }

    if (!control) {
      control = document.createElement('label');
      control.className = 'eq-control';
      control.innerHTML = `
        <span class="eq-control__name"></span>
        <input type="range" min="-12" max="12" value="0" step="0.5" />
        <span class="eq-control__value">0 dB</span>
      `;
    }

    const value = this._eqValues[mode] && this._eqValues[mode][band.key] !== undefined
      ? this._eqValues[mode][band.key]
      : 0;

    const nameEl = control.querySelector('.eq-control__name');
    const slider = control.querySelector('input[type="range"]');
    const valueEl = control.querySelector('.eq-control__value');

    nameEl.textContent = band.label;
    slider.value = String(value);
    slider.min = String(band.min ?? -12);
    slider.max = String(band.max ?? 12);
    slider.step = String(band.step ?? 0.5);
    slider.dataset.eqMode = mode;
    slider.dataset.bandKey = band.key;
    slider.setAttribute('aria-label', `${band.label} gain in dB`);
    valueEl.textContent = this.formatEqValue(value);

    // non-zero indicator
    if (value !== 0) control.classList.add('has-gain');

    return control;
  }

  setEqualizerMode(mode, persist = true, notify = true) {
    const nextMode = this.normalizeEqMode(mode);
    this._eqMode = nextMode;
    if (this.isManualEqMode(nextMode)) {
      this._lastManualEqMode = nextMode;
    }

    this.renderEqualizerUI();
    this.rebuildEqualizerRouting();
    this.applyManualEqGains();
    this.syncAutoEqState();

    if (persist) {
      this.saveEqualizerState();
    }

    if (notify) {
      this.showToast(`EQ: ${this.describeEqMode(nextMode)}`, '🎚');
    }
  }

  applyPreset(preset, persist = true, notify = true, activateMode = true) {
    const nextPreset = this.normalizePresetKey(preset);
    const presetConfig = this.getPresetConfig(nextPreset);
    this._eqPreset = nextPreset;

    MANUAL_EQ_MODES.forEach((mode) => {
      this._eqValues[mode] = this.buildPresetValuesForMode(mode, nextPreset);
    });

    if (presetConfig && presetConfig.volumeBoost !== undefined) {
      this.setVolumeBoost(presetConfig.volumeBoost, false, false);
    }

    if (presetConfig && presetConfig.limiterEnabled !== undefined) {
      this.setLimiterEnabled(presetConfig.limiterEnabled, false, false);
    }

    let nextMode = this._eqMode;
    if (activateMode) {
      if (presetConfig && presetConfig.mode === 'auto') {
        nextMode = 'auto';
      } else if (!(presetConfig && presetConfig.keepCurrentMode) && !this.isManualEqMode(this._eqMode)) {
        nextMode = this.getPreferredManualEqMode();
      }
    }

    if (nextMode !== this._eqMode) {
      this.setEqualizerMode(nextMode, false, false);
    } else {
      this.renderEqualizerUI();
      this.rebuildEqualizerRouting();
      this.applyManualEqGains();
      this.syncAutoEqState();
    }

    if (persist) {
      this.saveEqualizerState();
    }

    if (notify) {
      this.showToast(`Preset: ${this.describeEqPreset(nextPreset)}`, '🎛');
    }
  }

  setLimiterEnabled(enabled, persist = true, notify = true) {
    this._limiterEnabled = Boolean(enabled);
    this.rebuildEqualizerRouting();
    if (DOM.eqLimiterToggle) {
      DOM.eqLimiterToggle.checked = this._limiterEnabled;
    }

    if (persist) {
      this.saveEqualizerState();
    }

    if (notify) {
      this.showToast(this._limiterEnabled ? 'Limiter on' : 'Limiter off', '🛡');
    }
  }

  ensureEqFiltersForMode(mode) {
    if (!this._audioCtx) return [];
    if (this._eqFilterChains.has(mode)) {
      return this._eqFilterChains.get(mode);
    }

    const defs = mode === 'auto' ? AUTO_EQ_FILTER_BANDS : this.getEqualizerBandsForMode(mode);
    const chain = defs.map((band) => {
      const filter = this._audioCtx.createBiquadFilter();
      filter.type = band.type;
      filter.frequency.value = band.freq;
      filter.Q.value = band.q || 0.9;
      filter.gain.value = 0;
      return filter;
    });

    this._eqFilterChains.set(mode, chain);
    return chain;
  }

  disconnectAllEqFilters() {
    this._eqFilterChains.forEach((chain) => {
      chain.forEach((node) => {
        try {
          node.disconnect();
        } catch {
          // Ignore disconnected node errors.
        }
      });
    });
  }

  rebuildEqualizerRouting() {
    if (!this._audioCtx || !this._inputNode || !this._analyser || !this._audioGraphConnected) return;

    const safe = (node) => { if (node) try { node.disconnect(); } catch { /* ignore */ } };

    safe(this._inputNode);
    safe(this._limiter);
    this.disconnectAllEqFilters();
    this.disconnectPeqFilters();
    this.disconnectCrossfeedNodes();
    this.disconnectConvolverNodes();
    safe(this._analysisAnalyser);
    safe(this._analyser);

    let outputNode = this._inputNode;

    // ABX bypass — skip all DSP colour but keep level.
    if (!this._dspBypassed) {

    // EQ filter chain
    if (this._eqMode !== 'off') {
      const chainMode = this._eqMode === 'auto' ? 'auto' : this._eqMode;
      const chain = this.ensureEqFiltersForMode(chainMode);
      if (chain.length) {
        outputNode.connect(chain[0]);
        for (let i = 0; i < chain.length - 1; i++) chain[i].connect(chain[i + 1]);
        outputNode = chain[chain.length - 1];
      }
    }

    // Parametric EQ
    if (this._peqEnabled) {
      const peqChain = this.ensurePeqFilters();
      if (peqChain.length) {
        outputNode.connect(peqChain[0]);
        for (let i = 0; i < peqChain.length - 1; i++) peqChain[i].connect(peqChain[i + 1]);
        outputNode = peqChain[peqChain.length - 1];
      }
    }

    // Limiter
    if (this._limiterEnabled && this._limiter) {
      outputNode.connect(this._limiter);
      outputNode = this._limiter;
    }

    // Crossfeed
    if (this._crossfeedEnabled) outputNode = this.connectCrossfeed(outputNode);

    // Convolver
    if (this._convolverEnabled && this._convolverNodesReady()) outputNode = this.connectConvolver(outputNode);

    } // end dspBypassed check

    outputNode.connect(this._outputGain);
    outputNode.connect(this._analyser);

    // Analysis analyser for Auto EQ
    if (this._eqMode === 'auto' && this._analysisAnalyser && !this._dspBypassed) {
      this._inputNode.connect(this._analysisAnalyser);
    }
  }

  setEqualizerBand(mode, bandKey, value) {
    if (!this.isManualEqMode(mode)) return;

    if (!this._eqValues[mode]) {
      this._eqValues[mode] = {};
    }

    const band = this.getBandDefinition(mode, bandKey);
    this._eqValues[mode][bandKey] = this.clampEqValue(
      value,
      band?.min ?? -12,
      band?.max ?? 12,
    );

    if (this._eqMode === mode) {
      this.applyManualEqGains();
    }

    this.saveEqualizerState();
  }

  applyManualEqGains() {
    if (!this._audioCtx || !this.isManualEqMode(this._eqMode)) return;

    const defs = this.getEqualizerBandsForMode(this._eqMode);
    const chain = this.ensureEqFiltersForMode(this._eqMode);
    const now = this._audioCtx.currentTime;

    defs.forEach((band, idx) => {
      const gain = this._eqValues[this._eqMode] && this._eqValues[this._eqMode][band.key] !== undefined
        ? this._eqValues[this._eqMode][band.key]
        : 0;
      if (chain[idx]) {
        chain[idx].gain.setTargetAtTime(gain, now, EQ_GAIN_SMOOTH_TIME);
      }
    });
  }

  syncAutoEqState() {
    const shouldRun = Boolean(
      this._eqMode === 'auto'
      && this.isPlaying
      && this._isPageVisible
      && this._analysisAnalyser
      && !this._powerSaveMode
    );

    if (shouldRun) {
      this.startAutoEqLoop();
    } else {
      this.stopAutoEqLoop();
    }
  }

  startAutoEqLoop() {
    if (this._autoEqRaf) return;

    const tick = (ts) => {
      this._autoEqRaf = requestAnimationFrame(tick);
      if (ts - this._autoEqLastTick < AUTO_EQ_INTERVAL_MS) return;
      this._autoEqLastTick = ts;
      this.runAutoEqStep();
    };

    this._autoEqLastTick = 0;
    tick(0);
  }

  stopAutoEqLoop() {
    if (this._autoEqRaf) {
      cancelAnimationFrame(this._autoEqRaf);
      this._autoEqRaf = null;
    }
    this._autoEqLastTick = 0;
  }

  runAutoEqStep() {
    if (this._eqMode !== 'auto' || !this._audioCtx || !this._analysisAnalyser) return;

    const chain = this.ensureEqFiltersForMode('auto');
    if (chain.length < 3) return;

    if (!this._autoEqFreqData || this._autoEqFreqData.length !== this._analysisAnalyser.frequencyBinCount) {
      this._autoEqFreqData = new Uint8Array(this._analysisAnalyser.frequencyBinCount);
    }

    this._analysisAnalyser.getByteFrequencyData(this._autoEqFreqData);
    const sampleRate = this._audioCtx.sampleRate;
    const nyquist = sampleRate / 2;

    const levelForRange = (low, high) => {
      const length = this._autoEqFreqData.length;
      const start = Math.max(0, Math.floor((low / nyquist) * length));
      const end = Math.min(length - 1, Math.ceil((high / nyquist) * length));
      if (end <= start) return 0;

      let total = 0;
      let count = 0;
      for (let i = start; i <= end; i++) {
        total += this._autoEqFreqData[i];
        count++;
      }

      return count ? (total / count) / 255 : 0;
    };

    const levels = {
      bass: levelForRange(25, 220),
      mid: levelForRange(220, 2400),
      treble: levelForRange(2400, 12000),
    };

    const avg = (levels.bass + levels.mid + levels.treble) / 3 || 0;
    const targets = {};

    AUTO_EQ_ANALYSIS_BANDS.forEach((band) => {
      const delta = (avg - levels[band.key]) * 14;
      targets[band.key] = this.clampEqValue(delta, band.min, band.max);
    });

    const smooth = 0.18;
    this._autoEqGains.bass = this._autoEqGains.bass * (1 - smooth) + targets.bass * smooth;
    this._autoEqGains.mid = this._autoEqGains.mid * (1 - smooth) + targets.mid * smooth;
    this._autoEqGains.treble = this._autoEqGains.treble * (1 - smooth) + targets.treble * smooth;

    const now = this._audioCtx.currentTime;
    chain[0].gain.setTargetAtTime(this._autoEqGains.bass, now, AUTO_EQ_GAIN_SMOOTH_TIME);
    chain[1].gain.setTargetAtTime(this._autoEqGains.mid, now, AUTO_EQ_GAIN_SMOOTH_TIME);
    chain[2].gain.setTargetAtTime(this._autoEqGains.treble, now, AUTO_EQ_GAIN_SMOOTH_TIME);

    if (DOM.eqAutoStatus && this._eqMode === 'auto') {
      DOM.eqAutoStatus.textContent = `Auto EQ B ${this.formatEqValue(this._autoEqGains.bass)} · M ${this.formatEqValue(this._autoEqGains.mid)} · T ${this.formatEqValue(this._autoEqGains.treble)}`;
    }
  }

  stopAndResetMedia(media, clearSource = false) {
    if (!media) return;
    media.pause();
    media.currentTime = 0;
    if (clearSource) {
      media.removeAttribute('src');
      media.load();
    }
  }

  getTrackMediaType(track) {
    if (!track) return 'audio';
    if (track.mediaType === 'video' || track.mediaType === 'audio') {
      return track.mediaType;
    }
    const src = (track.src || '').toLowerCase().split('?')[0];
    return /\.(mp4|m4v|webm|ogv|mov)$/i.test(src) ? 'video' : 'audio';
  }

  pickTrackSource(track) {
    const primary = track && track.src ? track.src : '';

    if (!this._isVideoTrack || !this._powerSaveMode) {
      return { src: primary, using480p: false };
    }

    if (track._disableAuto480) {
      return { src: primary, using480p: false };
    }

    if (track.src480) {
      return { src: track.src480, using480p: true };
    }

    const derived = this.derive480pSource(primary);
    if (derived) {
      return { src: derived, using480p: true };
    }

    return { src: primary, using480p: false };
  }

  derive480pSource(src) {
    if (!src || this.isObjectUrl(src)) return null;

    const clean = src.split(/[?#]/)[0];
    const suffix = src.slice(clean.length);
    const match = clean.match(/^(.*)(\.[^./]+)$/);
    if (!match) return null;

    if (/[-_ ]480p$/i.test(match[1])) return src;
    return `${match[1]}-480p${match[2]}${suffix}`;
  }

  isObjectUrl(src) {
    return typeof src === 'string' && src.startsWith('blob:');
  }

  setVideoState(visible) {
    if (!this.video) return;
    this.video.classList.toggle('is-visible', visible);
    this.video.setAttribute('aria-hidden', String(!visible));
    DOM.vinylDisc.classList.toggle('is-video-mode', visible);
    DOM.tonearmWrapper.classList.toggle('is-hidden', visible);
  }

  /* ════════════════════════════════════════════
     MEDIA EVENT BINDING
  ════════════════════════════════════════════ */
  bindMediaEvents() {
    this.bindMediaElementEvents(this.audio);
    this.bindMediaElementEvents(this.video);
  }

  bindMediaElementEvents(media) {
    if (!media) return;

    media.addEventListener('play', () => {
      if (media !== this.media) return;
      this.isPlaying = true;
      this.syncVisualState();
      this.updatePlayBtn(true);
      this.highlightActiveTrack();
      this.scheduleSeekUI(true);
    });

    media.addEventListener('pause', () => {
      if (media !== this.media) return;
      this.isPlaying = false;
      this.syncVisualState();
      this.updatePlayBtn(false);
      this.highlightActiveTrack();
      this.scheduleSeekUI(true);
      this.saveResumeState();
    });

    media.addEventListener('ended', () => {
      if (media !== this.media) return;
      if (this._sleepAtTrackEnd) {
        this._sleepAtTrackEnd = false;
        this._sleepFadeFactor = 1;
        this.applyVolumeAndMute();
        this.updateSleepUI();
        this.showToast('Sleep timer ended playback', '🌙');
        return;
      }
      this.next(true);
    });

    media.addEventListener('timeupdate', () => {
      if (media !== this.media) return;
      this.checkLoopBoundary();
      if (!this._seekDragging) this.scheduleSeekUI(false);
    });

    media.addEventListener('durationchange', () => {
      if (media !== this.media) return;
      DOM.totalDuration.textContent = this.formatTime(media.duration);
      DOM.seekBar.setAttribute('aria-valuemax', media.duration || 100);
      this.scheduleSeekUI(true);
    });

    media.addEventListener('loadedmetadata', () => {
      if (media !== this.media) return;
      DOM.totalDuration.textContent = this.formatTime(media.duration);
      // Update playlist item duration
      const items = DOM.trackList.querySelectorAll('.track-item');
      const item  = items[this.currentIndex];
      if (item) {
        const dur = item.querySelector('.track-item__duration');
        if (dur) dur.textContent = this.formatTime(media.duration);
      }
      this.scheduleSeekUI(true);
    });

    media.addEventListener('error', () => {
      if (media !== this.media) return;

      // If 480p fallback source is missing, retry once with original source.
      if (this._isVideoTrack && this._using480pVideo && !this._sourceFallbackAttempted) {
        const track = this.playlist[this.currentIndex];
        if (track && track.src && this.media.getAttribute('src') !== track.src) {
          this._sourceFallbackAttempted = true;
          track._disableAuto480 = true;
          const resumeAt = this.media.currentTime || 0;
          const shouldResume = this._autoPlayRequested || this.isPlaying;
          this.showToast('480p source unavailable, using original video', '⚡');
          this.loadTrack(this.currentIndex, shouldResume, resumeAt);
          return;
        }
      }

      const err = media.error;
      let msg = 'Could not load track.';
      if (err && err.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        msg = 'Track unavailable or unsupported format.';
      }
      this.showToast(msg, '⚠');
    });

    media.addEventListener('waiting', () => {
      // Could show a loading spinner here
    });
  }

  /* ════════════════════════════════════════════
     UI EVENT BINDING
  ════════════════════════════════════════════ */
  bindUIEvents() {
    // Play / Pause
    DOM.playBtn.addEventListener('click', () => this.togglePlay());

    // Prev / Next
    DOM.prevBtn.addEventListener('click', () => this.prev());
    DOM.nextBtn.addEventListener('click', () => this.next(false));

    // Shuffle
    DOM.shuffleBtn.addEventListener('click', () => this.toggleShuffle());

    // Repeat
    DOM.repeatBtn.addEventListener('click', () => this.toggleRepeat());

    // Seek bar
    DOM.seekBar.addEventListener('input', () => {
      this._seekDragging = true;
      const pct = DOM.seekBar.value;
      DOM.seekFill.style.width = `${pct}%`;
      const t = (pct / 100) * (this.media.duration || 0);
      DOM.currentTime.textContent = this.formatTime(t);
    });
    DOM.seekBar.addEventListener('change', () => {
      const pct = DOM.seekBar.value;
      const t   = (pct / 100) * (this.media.duration || 0);
      if (isFinite(t)) this.media.currentTime = t;
      this._seekDragging = false;
    });

    // Touch events for mobile seek
    DOM.seekBar.addEventListener('touchstart', () => { this._seekDragging = true; }, { passive: true });
    DOM.seekBar.addEventListener('touchend',   () => {
      const pct = DOM.seekBar.value;
      const t   = (pct / 100) * (this.media.duration || 0);
      if (isFinite(t)) this.media.currentTime = t;
      this._seekDragging = false;
    });

    // Theme
    DOM.themeToggle.addEventListener('click', () => this.toggleTheme());

    // Skin selector
    if (DOM.skinSelect) {
      DOM.skinSelect.addEventListener('change', () => {
        this.applySkin(DOM.skinSelect.value, true);
      });
    }

    // Mini-player mode
    if (DOM.miniModeToggle) {
      DOM.miniModeToggle.addEventListener('click', () => this.toggleMiniPlayerMode());
    }
    if (DOM.miniExpandBtn) {
      DOM.miniExpandBtn.addEventListener('click', () => this.setMiniPlayerMode(false, true));
    }
    if (DOM.miniPrevBtn) DOM.miniPrevBtn.addEventListener('click', () => this.prev());
    if (DOM.miniPlayBtn) DOM.miniPlayBtn.addEventListener('click', () => this.togglePlay());
    if (DOM.miniNextBtn) DOM.miniNextBtn.addEventListener('click', () => this.next(false));

    // Equalizer mode / controls
    if (DOM.eqModeSelect) {
      DOM.eqModeSelect.addEventListener('change', () => {
        this.setEqualizerMode(DOM.eqModeSelect.value, true, true);
      });
    }

    if (DOM.eqPresetSelect) {
      DOM.eqPresetSelect.addEventListener('change', () => {
        this.applyPreset(DOM.eqPresetSelect.value, true, true);
      });
    }

    if (DOM.boosterBar) {
      DOM.boosterBar.addEventListener('input', () => {
        this.setVolumeBoost(DOM.boosterBar.value, false, false);
      });

      DOM.boosterBar.addEventListener('change', () => {
        this.setVolumeBoost(DOM.boosterBar.value, true, false);
      });
    }

    if (DOM.eqLimiterToggle) {
      DOM.eqLimiterToggle.addEventListener('change', () => {
        this.setLimiterEnabled(DOM.eqLimiterToggle.checked, true, true);
      });
    }

    if (DOM.eqResetBtn) {
      DOM.eqResetBtn.addEventListener('click', () => this.zeroAllEqBands());
    }

    if (DOM.eqBandContainer) {
      DOM.eqBandContainer.addEventListener('click', (e) => {
        const control = e.target.closest('.eq-control');
        if (!control || e.target.closest('input[type="range"]')) return;
        const isExpanded = control.classList.contains('is-expanded');
        // collapse any other open band first
        DOM.eqBandContainer.querySelectorAll('.eq-control.is-expanded').forEach(el => el.classList.remove('is-expanded'));
        if (!isExpanded) control.classList.add('is-expanded');
      });

      DOM.eqBandContainer.addEventListener('input', (e) => {
        const slider = e.target.closest('input[type="range"][data-eq-mode][data-band-key]');
        if (!slider) return;

        const mode = slider.dataset.eqMode;
        const bandKey = slider.dataset.bandKey;
        const band = this.getBandDefinition(mode, bandKey);
        const value = this.clampEqValue(
          slider.value,
          band?.min ?? -12,
          band?.max ?? 12,
        );
        this.setEqualizerBand(mode, bandKey, value);

        const control = slider.closest('.eq-control');
        const valueEl = control?.querySelector('.eq-control__value');
        if (valueEl) valueEl.textContent = this.formatEqValue(value);
        if (control) control.classList.toggle('has-gain', value !== 0);
        this.drawEqCurve();
      });

      // keyboard nudge on expanded band
      DOM.eqBandContainer.addEventListener('keydown', (e) => {
        const slider = e.target.closest('input[type="range"][data-eq-mode][data-band-key]');
        if (!slider) return;
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault();

        const mode = slider.dataset.eqMode;
        const bandKey = slider.dataset.bandKey;
        const band = this.getBandDefinition(mode, bandKey);
        const delta = e.key === 'ArrowUp' ? 0.5 : -0.5;
        const current = this._eqValues[mode]?.[bandKey] ?? 0;
        const next = this.clampEqValue(current + delta, band?.min ?? -12, band?.max ?? 12);

        slider.value = String(next);
        this.setEqualizerBand(mode, bandKey, next);

        const control = slider.closest('.eq-control');
        const valueEl = control?.querySelector('.eq-control__value');
        if (valueEl) valueEl.textContent = this.formatEqValue(next);
        if (control) control.classList.toggle('has-gain', next !== 0);
        this.drawEqCurve();
      });
    }

    // Battery saver
    if (DOM.powerToggle) {
      DOM.powerToggle.addEventListener('click', () => this.togglePowerSaveOverride());
    }

    // Nav drawer
    DOM.navToggle.addEventListener('click', () => this.openNav());
    DOM.navClose.addEventListener('click',  () => this.closeNav());
    DOM.navOverlay.addEventListener('click',() => this.closeNav());

    // Install banner
    DOM.installDismiss.addEventListener('click', () => {
      DOM.installBanner.hidden = true;
    });
    DOM.installAccept.addEventListener('click', () => {
      this.triggerInstall();
    });

    // Local file picker
    if (DOM.addTracksBtn && DOM.filePicker) {
      DOM.addTracksBtn.addEventListener('click', () => {
        DOM.filePicker.click();
      });
      DOM.filePicker.addEventListener('change', () => {
        this.addLocalFiles(DOM.filePicker.files);
        DOM.filePicker.value = '';
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Playlist click delegation
    DOM.trackList.addEventListener('click', (e) => {
      const item = e.target.closest('.track-item');
      if (!item) return;
      const idx = parseInt(item.dataset.index, 10);
      if (idx === this.currentIndex) {
        this.togglePlay();
      } else {
        this.loadTrack(idx, true);
      }
    });
  }

  bindDragAndDrop() {
    if (!DOM.dropZone) return;

    const prevent = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const activate = () => DOM.dropZone.classList.add('is-dragover');
    const deactivate = () => DOM.dropZone.classList.remove('is-dragover');

    ['dragenter', 'dragover'].forEach((eventName) => {
      DOM.dropZone.addEventListener(eventName, (e) => {
        prevent(e);
        activate();
      });
    });

    ['dragleave', 'dragend'].forEach((eventName) => {
      DOM.dropZone.addEventListener(eventName, (e) => {
        prevent(e);
        deactivate();
      });
    });

    DOM.dropZone.addEventListener('drop', (e) => {
      prevent(e);
      deactivate();
      const files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length) this.addLocalFiles(files);
    });

    DOM.dropZone.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (DOM.filePicker) DOM.filePicker.click();
    });

    DOM.dropZone.addEventListener('click', () => {
      if (DOM.filePicker) DOM.filePicker.click();
    });

    document.addEventListener('dragover', (e) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
        e.preventDefault();
      }
    });

    document.addEventListener('drop', (e) => {
      if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
      if (e.target.closest && e.target.closest('#dropZone')) return;
      e.preventDefault();
      this.addLocalFiles(e.dataTransfer.files);
      deactivate();
    });
  }

  /* ─── Keyboard shortcuts ───────────────────── */
  handleKeyboard(e) {
    // Don't intercept when typing
    if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        this.togglePlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.media.currentTime = Math.max(0, this.media.currentTime - 5);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.media.currentTime = Math.min(this.media.duration || 0, this.media.currentTime + 5);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.nudgeVolumeBoost(5);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.nudgeVolumeBoost(-5);
        break;
      case 'KeyS':
        this.toggleShuffle();
        break;
      case 'KeyR':
        this.toggleRepeat();
        break;
      case 'KeyN':
        this.next(false);
        break;
      case 'KeyP':
        this.prev();
        break;
    }
  }

  /* ─── Network status ────────────────────────── */
  bindNetworkEvents() {
    const update = () => {
      const online = navigator.onLine;
      DOM.statusDot.className  = `status-dot ${online ? 'status-dot--online' : 'status-dot--offline'}`;
      DOM.statusText.textContent = online ? 'Online' : 'Offline';
      if (!online) {
        this.showToast('Offline — playing from cache', '📶');
      }
    };
    window.addEventListener('online',  update);
    window.addEventListener('offline', update);
    update();
  }

  /* ─── Runtime efficiency controls ─────────── */
  configureRuntimeEfficiency() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const syncPowerSave = () => {
      const wasPowerSave = this._powerSaveMode;
      const saveData = Boolean(connection && connection.saveData);
      this._slowNetwork = Boolean(connection && ['slow-2g', '2g'].includes(connection.effectiveType));
      const autoPowerSave = reducedMotion.matches || saveData || this._slowNetwork || this._batteryLow;
      this._powerSaveMode = this._powerSaveOverride === 'on' ? true : autoPowerSave;
      document.documentElement.classList.toggle('power-save', this._powerSaveMode);

      if (this.video) {
        this.video.preload = this._powerSaveMode ? 'none' : 'metadata';
      }

      this.updatePowerToggleUI();

      if (wasPowerSave !== this._powerSaveMode && this._isVideoTrack) {
        const resumeAt = this.media.currentTime || 0;
        const shouldResume = this.isPlaying;
        this.loadTrack(this.currentIndex, shouldResume, resumeAt);
        return;
      }

      this.syncVisualState();
    };

    this._syncPowerSave = syncPowerSave;

    if (reducedMotion.addEventListener) {
      reducedMotion.addEventListener('change', syncPowerSave);
    } else if (reducedMotion.addListener) {
      reducedMotion.addListener(syncPowerSave);
    }

    if (connection && connection.addEventListener) {
      connection.addEventListener('change', syncPowerSave);
    }

    this.bindBatterySignals();

    document.addEventListener('visibilitychange', () => {
      this._isPageVisible = !document.hidden;

      if (!this._isPageVisible && this._isVideoTrack && !this.media.paused) {
        this.media.pause();
        this._autoPausedVideoForHidden = true;
      }

      if (this._isPageVisible && this._autoPausedVideoForHidden) {
        this._autoPausedVideoForHidden = false;
        this.showToast('Video paused in background to save battery', '🔋');
      }

      this.syncVisualState();
      if (this._isPageVisible) {
        this.scheduleSeekUI(true);
      } else {
        this.cancelScheduledSeekUI();
      }
    });

    window.addEventListener('pagehide', () => {
      this.cancelScheduledSeekUI();
    });

    window.addEventListener('beforeunload', () => {
      this.stopWaveformLoop();
      this.stopAutoEqLoop();
      if (this._waveformResizeHandler) {
        window.removeEventListener('resize', this._waveformResizeHandler);
      }
      this.cleanupObjectUrls();
    });

    syncPowerSave();
  }

  loadPowerSaveOverride() {
    const stored = localStorage.getItem('groove-power-save-override');
    return stored === 'on' ? 'on' : null;
  }

  togglePowerSaveOverride() {
    const forcing = this._powerSaveOverride === 'on';
    this._powerSaveOverride = forcing ? null : 'on';

    if (this._powerSaveOverride === 'on') {
      localStorage.setItem('groove-power-save-override', 'on');
      this.showToast('Battery Saver forced on', '🔋');
    } else {
      localStorage.removeItem('groove-power-save-override');
      this.showToast('Battery Saver returned to auto', '⚡');
    }

    if (this._syncPowerSave) {
      this._syncPowerSave();
      this.scheduleSeekUI(true);
    }
  }

  updatePowerToggleUI() {
    if (!DOM.powerToggle && !DOM.powerState) return;

    const manualOn = this._powerSaveOverride === 'on';
    const autoReason = this._batteryLow
      ? 'low battery'
      : (this._slowNetwork ? 'slow network' : 'system preference');
    const status = manualOn
      ? 'On (manual)'
      : (this._powerSaveMode ? `On (auto, ${autoReason})` : 'Off');
    let shortLabel = manualOn
      ? 'Saver Manual'
      : (this._powerSaveMode
        ? (this._batteryLow ? 'Saver LowBat' : (this._slowNetwork ? 'Saver Net' : 'Saver Auto'))
        : 'Saver Off');
    if (this._isVideoTrack && this._powerSaveMode) {
      shortLabel += this._using480pVideo ? ' · 480p' : ' · Source';
    }

    if (DOM.powerToggle) {
      DOM.powerToggle.classList.toggle('is-active', this._powerSaveMode);
      DOM.powerToggle.setAttribute('aria-pressed', String(manualOn));
      DOM.powerToggle.setAttribute('title', `Battery Saver: ${status}`);
      DOM.powerToggle.setAttribute('aria-label', manualOn
        ? 'Turn off manual battery saver'
        : 'Turn on manual battery saver');
    }

    if (DOM.powerState) {
      DOM.powerState.textContent = shortLabel;
      DOM.powerState.classList.toggle('is-active', this._powerSaveMode);
    }
  }

  bindBatterySignals() {
    if (typeof navigator.getBattery !== 'function') return;

    navigator.getBattery().then((battery) => {
      const updateBatteryState = () => {
        this._batteryLow = !battery.charging && battery.level <= 0.2;
        if (this._syncPowerSave) this._syncPowerSave();
      };

      battery.addEventListener('levelchange', updateBatteryState);
      battery.addEventListener('chargingchange', updateBatteryState);
      updateBatteryState();
    }).catch(() => {
      // Battery status API is optional; ignore if unavailable.
    });
  }

  /* ════════════════════════════════════════════
     UI HELPERS
  ════════════════════════════════════════════ */
  setVinylState(playing) {
    DOM.vinylDisc.classList.toggle('is-spinning', playing);
    DOM.tonearmWrapper.classList.toggle('is-playing', playing);
  }

  syncVisualState() {
    const shouldAnimate = this.isPlaying
      && this._isPageVisible
      && !this._powerSaveMode
      && !this._isVideoTrack;
    this.setVinylState(shouldAnimate);
    this.syncWaveformState();
    this.syncAutoEqState();
  }

  updatePlayBtn(playing) {
    DOM.playBtn.querySelector('.icon-play').style.display  = playing ? 'none' : 'block';
    DOM.playBtn.querySelector('.icon-pause').style.display = playing ? 'block' : 'none';
    DOM.playBtn.setAttribute('aria-pressed', String(playing));
    DOM.playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    DOM.playBtn.classList.toggle('is-playing', playing);

    if (DOM.miniPlayBtn) {
      const miniPlayIcon = DOM.miniPlayBtn.querySelector('.icon-play');
      const miniPauseIcon = DOM.miniPlayBtn.querySelector('.icon-pause');
      if (miniPlayIcon) miniPlayIcon.style.display = playing ? 'none' : 'block';
      if (miniPauseIcon) miniPauseIcon.style.display = playing ? 'block' : 'none';
      DOM.miniPlayBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      DOM.miniPlayBtn.setAttribute('aria-pressed', String(playing));
    }
  }

  updateMiniMeta(track = null) {
    if (!DOM.miniTrackTitle || !DOM.miniTrackArtist) return;
    const nowTrack = track || this.playlist[this.currentIndex];
    DOM.miniTrackTitle.textContent = nowTrack ? nowTrack.title : 'Select a Track';
    DOM.miniTrackArtist.textContent = nowTrack ? nowTrack.artist : '—';
  }

  loadMiniPlayerMode() {
    return localStorage.getItem('groove-mini-player') === 'on';
  }

  toggleMiniPlayerMode() {
    this.setMiniPlayerMode(!this._miniPlayerMode, true);
  }

  setMiniPlayerMode(enabled, persist = true) {
    this._miniPlayerMode = Boolean(enabled);
    document.body.classList.toggle('mini-player-mode', this._miniPlayerMode);

    if (DOM.miniPlayer) {
      DOM.miniPlayer.hidden = !this._miniPlayerMode;
    }

    if (DOM.miniModeToggle) {
      DOM.miniModeToggle.classList.toggle('is-active', this._miniPlayerMode);
      DOM.miniModeToggle.setAttribute('aria-pressed', String(this._miniPlayerMode));
      DOM.miniModeToggle.setAttribute('title', this._miniPlayerMode ? 'Mini Player: On' : 'Mini Player: Off');
    }

    if (persist) {
      if (this._miniPlayerMode) {
        localStorage.setItem('groove-mini-player', 'on');
        this.showToast('Mini player enabled', '▣');
      } else {
        localStorage.removeItem('groove-mini-player');
        this.showToast('Mini player disabled', '▢');
      }
    }

    this.updateMiniMeta();
  }

  updateSeekUI() {
    if (!this._isPageVisible) return;
    const media = this.media;
    if (!media.duration || !isFinite(media.duration)) return;
    const pct = (media.currentTime / media.duration) * 100;
    DOM.seekBar.value = pct;
    DOM.seekFill.style.width = `${pct}%`;
    DOM.currentTime.textContent = this.formatTime(media.currentTime);
    DOM.seekBar.setAttribute('aria-valuenow', pct.toFixed(1));
    DOM.seekBar.setAttribute('aria-valuetext', `${this.formatTime(media.currentTime)} of ${this.formatTime(media.duration)}`);
  }

  scheduleSeekUI(force = false) {
    if (this._seekDragging || !this._isPageVisible) return;

    this._seekPaintInterval = this.getSeekPaintInterval();
    const now = performance.now();
    if (!force && now - this._lastSeekPaint < this._seekPaintInterval) return;
    if (this._seekRaf) return;

    this._seekRaf = requestAnimationFrame(() => {
      this._seekRaf = null;
      this._lastSeekPaint = performance.now();
      this.updateSeekUI();
    });
  }

  getSeekPaintInterval() {
    if (this._powerSaveMode) return 700;
    if (this._isVideoTrack) return this._isLikelyMobile ? 550 : 380;
    return this._isLikelyMobile ? 320 : 250;
  }

  cancelScheduledSeekUI() {
    if (!this._seekRaf) return;
    cancelAnimationFrame(this._seekRaf);
    this._seekRaf = null;
  }

  animateMetaChange(callback) {
    DOM.trackTitle.classList.remove('track-change');
    // Force reflow
    void DOM.trackTitle.offsetWidth;
    callback();
    DOM.trackTitle.classList.add('track-change');
  }

  highlightActiveTrack() {
    const items = DOM.trackList.querySelectorAll('.track-item');
    items.forEach((item, i) => {
      const isActive  = i === this.currentIndex;
      const isVideo   = this.getTrackMediaType(this.playlist[i]) === 'video';
      const isPlaying = isActive && this.isPlaying;
      item.classList.toggle('is-active',  isActive);
      item.classList.toggle('is-video',   isVideo);
      item.classList.toggle('is-playing', isPlaying && !isVideo);
      item.setAttribute('aria-selected', String(isActive));
    });
  }

  /* ─── Playlist render ───────────────────────── */
  renderPlaylist() {
    DOM.playlistCount.textContent = `${this.playlist.length} track${this.playlist.length !== 1 ? 's' : ''}`;
    DOM.trackList.innerHTML = '';

    this.playlist.forEach((track, i) => {
      const isVideo = this.getTrackMediaType(track) === 'video';
      const li = document.createElement('li');
      li.className = 'track-item';
      if (isVideo) li.classList.add('is-video');
      li.dataset.index = i;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.setAttribute('tabindex', '0');
      li.setAttribute('aria-label', `${track.title} by ${track.artist}${isVideo ? ' (video)' : ''}`);

      li.innerHTML = `
        <div class="track-item__num" aria-hidden="true">
          <img
            class="track-item__art"
            src="${track.cover || 'icons/icon-192.png'}"
            alt=""
            loading="lazy"
            onerror="this.src='icons/icon-192.png'"
          />
          <span class="track-item__index">${i + 1}</span>
          <div class="eq-bars" aria-hidden="true">
            <div class="eq-bar"></div>
            <div class="eq-bar"></div>
            <div class="eq-bar"></div>
          </div>
        </div>
        <div class="track-item__info">
          <div class="track-item__title">${this.escapeHTML(track.title)}</div>
          <div class="track-item__artist">${this.escapeHTML(track.artist)}${isVideo ? ' · VIDEO' : ''}</div>
        </div>
        <span class="track-item__duration">—</span>
      `;

      // Load cover art progressively
      const artImg = li.querySelector('.track-item__art');
      artImg.addEventListener('load', () => artImg.classList.add('loaded'));

      // Keyboard accessibility
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          li.click();
        }
      });

      DOM.trackList.appendChild(li);
    });
  }

  /* ─── Local file loading ───────────────────── */
  addLocalFiles(fileList) {
    if (!fileList || !fileList.length) return;

    const files = Array.from(fileList).filter((file) => this.isSupportedMediaFile(file));
    if (!files.length) {
      this.showToast('No playable media files selected', '⚠');
      return;
    }

    const tracks = this.buildTracksFromLocalFiles(files);
    if (!tracks.length) {
      this.showToast('No playable media files selected', '⚠');
      return;
    }

    const firstNewIndex = this.playlist.length;
    tracks.forEach((track) => {
      this.playlist.push(track);
    });

    this.renderPlaylist();
    this.loadTrack(firstNewIndex, true);
    this.showToast(`Loaded ${tracks.length} media file${tracks.length !== 1 ? 's' : ''}`, '♪');
  }

  buildTracksFromLocalFiles(files) {
    const tracks = [];
    const videoGroups = new Map();

    files.forEach((file) => {
      const mediaType = this.getFileMediaType(file);

      if (mediaType !== 'video') {
        tracks.push(this.buildTrackFromFile(file));
        return;
      }

      const key = this.getVideoPairKey(file.name);
      const group = videoGroups.get(key) || { base: null, low: null, extras: [] };

      if (this.isLikely480pFileName(file.name)) {
        if (!group.low || file.size < group.low.size) {
          if (group.low) group.extras.push(group.low);
          group.low = file;
        } else {
          group.extras.push(file);
        }
      } else if (!group.base) {
        group.base = file;
      } else {
        group.extras.push(file);
      }

      videoGroups.set(key, group);
    });

    videoGroups.forEach((group) => {
      if (group.base) {
        const src480 = group.low ? this.createObjectUrl(group.low) : null;
        tracks.push(this.buildTrackFromFile(group.base, { src480 }));
      } else if (group.low) {
        tracks.push(this.buildTrackFromFile(group.low));
      }

      group.extras.forEach((file) => {
        tracks.push(this.buildTrackFromFile(file));
      });
    });

    return tracks;
  }

  getVideoPairKey(fileName) {
    const base = (fileName || '').replace(/\.[^.]+$/, '').toLowerCase().trim();
    return base.replace(/[-_ ]480p$/i, '').trim();
  }

  isLikely480pFileName(fileName) {
    return /(?:^|[-_ ])480p(?:$|[-_ ])/i.test((fileName || '').toLowerCase());
  }

  isSupportedMediaFile(file) {
    if (!file) return false;
    if (file.type && (file.type.startsWith('audio/') || file.type.startsWith('video/'))) {
      return true;
    }
    return /\.(mp3|m4a|aac|ogg|wav|flac|mp4|m4v|webm|ogv|mov)$/i.test(file.name || '');
  }

  buildTrackFromFile(file, options = {}) {
    const objectUrl = this.createObjectUrl(file);
    const mediaType = this.getFileMediaType(file);

    const track = {
      title: this.toDisplayTitle(file.name),
      artist: mediaType === 'video' ? 'Local Video' : 'Local File',
      album: 'From device',
      src: objectUrl,
      cover: 'icons/icon-192.png',
      mediaType,
    };

    if (options.src480) {
      track.src480 = options.src480;
    }

    return track;
  }

  createObjectUrl(file) {
    const objectUrl = URL.createObjectURL(file);
    this._objectUrls.add(objectUrl);
    return objectUrl;
  }

  getFileMediaType(file) {
    if (!file) return 'audio';
    if (file.type && file.type.startsWith('video/')) return 'video';
    if (file.type && file.type.startsWith('audio/')) return 'audio';
    return /\.(mp4|m4v|webm|ogv|mov)$/i.test(file.name || '') ? 'video' : 'audio';
  }

  toDisplayTitle(fileName) {
    const raw = (fileName || 'Unknown Track').replace(/\.[^.]+$/, '');
    return raw
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  cleanupObjectUrls() {
    this._objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this._objectUrls.clear();
  }

  /* ─── Toast notification ────────────────────── */
  showToast(message, icon = 'ℹ') {
    clearTimeout(this._toastTimer);
    DOM.toastIcon.textContent = icon;
    DOM.toastMsg.textContent  = message;
    DOM.toast.hidden = false;

    // Force reflow for re-animation
    void DOM.toast.offsetWidth;
    DOM.toast.style.animation = 'none';
    void DOM.toast.offsetWidth;
    DOM.toast.style.animation = '';

    this._toastTimer = setTimeout(() => {
      DOM.toast.hidden = true;
    }, 2800);
  }

  /* ─── Time formatter ────────────────────────── */
  formatTime(sec) {
    if (!sec || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /* ─── HTML escape ───────────────────────────── */
  escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ════════════════════════════════════════════
     THEME
  ════════════════════════════════════════════ */
  loadTheme() {
    const saved = localStorage.getItem('groove-theme');
    const preferred = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    const theme = saved || preferred;
    document.documentElement.setAttribute('data-theme', theme);
    this.updateThemeMeta(theme);
  }

  loadSkin() {
    const validSkins = ['gold', 'ocean', 'sunset', 'forest'];
    const stored = localStorage.getItem('groove-skin') || 'gold';
    return validSkins.includes(stored) ? stored : 'gold';
  }

  applySkin(skin, persist = true) {
    const validSkins = ['gold', 'ocean', 'sunset', 'forest'];
    const nextSkin = validSkins.includes(skin) ? skin : 'gold';
    this._skin = nextSkin;
    document.documentElement.setAttribute('data-skin', nextSkin);

    if (DOM.skinSelect) {
      DOM.skinSelect.value = nextSkin;
    }

    if (persist) {
      localStorage.setItem('groove-skin', nextSkin);
      this.showToast(`Skin: ${nextSkin}`, '🎨');
    }

    if (!this._waveformRaf) {
      this.drawWaveformFrame(true);
    }
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('groove-theme', next);
    this.updateThemeMeta(next);
    if (!this._waveformRaf) {
      this.drawWaveformFrame(true);
    }
  }

  updateThemeMeta(theme) {
    const meta = document.getElementById('themeColorMeta');
    if (meta) meta.content = theme === 'dark' ? '#0d0d0d' : '#f5f0e8';
  }

  /* ════════════════════════════════════════════
     NAV DRAWER
  ════════════════════════════════════════════ */
  openNav() {
    DOM.navDrawer.classList.add('is-open');
    DOM.navOverlay.classList.add('is-open');
    DOM.navDrawer.setAttribute('aria-hidden', 'false');
    DOM.navToggle.setAttribute('aria-expanded', 'true');
    // Trap focus
    DOM.navClose.focus();
    document.body.style.overflow = 'hidden';
  }

  closeNav() {
    DOM.navDrawer.classList.remove('is-open');
    DOM.navOverlay.classList.remove('is-open');
    DOM.navDrawer.setAttribute('aria-hidden', 'true');
    DOM.navToggle.setAttribute('aria-expanded', 'false');
    DOM.navToggle.focus();
    document.body.style.overflow = '';
  }

  /* ════════════════════════════════════════════
     PWA INSTALL PROMPT
  ════════════════════════════════════════════ */
  bindInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      // Show banner after a short delay
      clearTimeout(this._installBannerTimer);
      this._installBannerTimer = setTimeout(() => {
        if (this._isPageVisible) DOM.installBanner.hidden = false;
      }, 3000);
    });

    window.addEventListener('appinstalled', () => {
      clearTimeout(this._installBannerTimer);
      DOM.installBanner.hidden = true;
      this.deferredPrompt = null;
      this.showToast('App installed! 🎉', '✓');
    });
  }

  async triggerInstall() {
    if (!this.deferredPrompt) return;
    DOM.installBanner.hidden = true;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    if (outcome === 'accepted') {
      this.showToast('Installing Groove…', '⬇');
    }
  }

  /* ════════════════════════════════════════════
     MEDIA SESSION API
     (lock-screen / notification controls)
  ════════════════════════════════════════════ */
  updateMediaSession(track) {
    if (!('mediaSession' in navigator)) return;
    const isHttp = location.protocol === 'http:' || location.protocol === 'https:';
    navigator.mediaSession.metadata = new MediaMetadata({
      title:  track.title,
      artist: track.artist,
      album:  track.album || '',
      artwork: isHttp ? [
        { src: track.cover || 'cover.svg', sizes: '192x192', type: 'image/svg+xml' },
      ] : [],
    });
    navigator.mediaSession.setActionHandler('play',         () => this.play());
    navigator.mediaSession.setActionHandler('pause',        () => this.media.pause());
    navigator.mediaSession.setActionHandler('previoustrack',() => this.prev());
    navigator.mediaSession.setActionHandler('nexttrack',    () => this.next(false));
    navigator.mediaSession.setActionHandler('seekto', (d) => {
      if (isFinite(d.seekTime)) this.media.currentTime = d.seekTime;
    });
  }

  /* ════════════════════════════════════════════
     SERVICE WORKER REGISTRATION
  ════════════════════════════════════════════ */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return;
    // Inject manifest only on http(s)
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel  = 'manifest';
      link.href = 'manifest.json';
      document.head.appendChild(link);
    }
    try {
      const reg = await navigator.serviceWorker.register('service-worker.js?v=1.3.2');
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.showToast('Update available — refresh to apply', '↻');
          }
        });
      });
    } catch (err) {
      console.warn('[Groove] Service Worker registration failed:', err);
    }
  }

  /* ════════════════════════════════════════════
     VOLUME SLIDER + MUTE
  ════════════════════════════════════════════ */
  _loadVolume() {
    const raw = localStorage.getItem('groove-volume');
    if (raw === null) return 100;
    const n = Number(raw);
    return isFinite(n) && n >= 0 && n <= 100 ? Math.round(n) : 100;
  }

  _applyVolumeSlider(value, persist = true) {
    this._volume = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    if (DOM.volumeBar) {
      DOM.volumeBar.value = String(this._volume);
      DOM.volumeBar.setAttribute('aria-valuenow', String(this._volume));
      DOM.volumeBar.setAttribute('aria-valuetext', `${this._volume}%`);
      const track = DOM.volumeBar.closest('.vol-track');
      if (track) track.style.setProperty('--thumb-pos', `${this._volume}%`);
    }
    if (DOM.volumeFill)  DOM.volumeFill.style.width  = `${this._volume}%`;
    if (DOM.volumeValue) DOM.volumeValue.textContent  = `${this._volume}%`;
    if (persist) localStorage.setItem('groove-volume', String(this._volume));
  }

  toggleMute() {
    this._muted = !this._muted;
    this._updateMuteUI();
    this.applyVolumeAndMute();
    this.showToast(this._muted ? 'Muted' : 'Unmuted', this._muted ? '🔇' : '🔊');
  }

  _updateMuteUI() {
    if (!DOM.muteBtn) return;
    DOM.muteBtn.setAttribute('aria-pressed', String(this._muted));
    DOM.muteBtn.setAttribute('aria-label',   this._muted ? 'Unmute' : 'Mute');
    DOM.muteBtn.setAttribute('title',        this._muted ? 'Unmute' : 'Mute');
    const iconUp  = DOM.muteBtn.querySelector('.icon-vol-up');
    const iconOff = DOM.muteBtn.querySelector('.icon-vol-off');
    if (iconUp)  iconUp.style.display  = this._muted ? 'none'  : 'block';
    if (iconOff) iconOff.style.display = this._muted ? 'block' : 'none';
  }

  /* ════════════════════════════════════════════
     FAVORITES
  ════════════════════════════════════════════ */
  loadFavorites() {
    try { return new Set(JSON.parse(localStorage.getItem('groove-favorites') || '[]')); }
    catch { return new Set(); }
  }
  saveFavorites() {
    localStorage.setItem('groove-favorites', JSON.stringify([...this._favorites]));
  }
  trackKey(track) { return track ? track.src : null; }
  isFavorite(track) { return this._favorites.has(this.trackKey(track)); }
  toggleFavorite(index = this.currentIndex) {
    const track = this.playlist[index];
    if (!track) return;
    const key = this.trackKey(track);
    if (this._favorites.has(key)) { this._favorites.delete(key); this.showToast('Removed from favorites', '🤍'); }
    else { this._favorites.add(key); this.showToast('Added to favorites', '❤'); }
    this.saveFavorites();
    this.updateFavoriteUI(track);
    if (this._favOnly) this.applyFilters();
  }
  updateFavoriteUI(track = this.playlist[this.currentIndex]) {
    if (!DOM.favoriteBtn) return;
    const fav = this.isFavorite(track);
    DOM.favoriteBtn.setAttribute('aria-pressed', String(fav));
    DOM.favoriteBtn.classList.toggle('is-active', fav);
    DOM.favoriteBtn.title = fav ? 'Remove from favorites' : 'Add to favorites';
  }

  /* ════════════════════════════════════════════
     SEARCH + FILTER
  ════════════════════════════════════════════ */
  applyFilters() { this.renderPlaylist(); }
  toggleFavoritesFilter() {
    this._favOnly = !this._favOnly;
    if (DOM.favFilterBtn) DOM.favFilterBtn.classList.toggle('is-active', this._favOnly);
    this.applyFilters();
  }

  /* ════════════════════════════════════════════
     PLAYBACK SPEED
  ════════════════════════════════════════════ */
  loadSpeed() {
    const n = Number(localStorage.getItem('groove-speed'));
    return isFinite(n) && n >= 0.25 && n <= 4 ? n : 1;
  }
  applySpeed(value, persist = true) {
    const v = Math.max(0.25, Math.min(4, Number(value) || 1));
    this._speed = v;
    if (this.audio) this.audio.playbackRate = v;
    if (this.video) this.video.playbackRate = v;
    if (DOM.speedBar)   DOM.speedBar.value        = String(v);
    if (DOM.speedValue) DOM.speedValue.textContent = `${v.toFixed(2).replace(/\.?0+$/, '')}×`;
    if (persist) localStorage.setItem('groove-speed', String(v));
  }

  /* ════════════════════════════════════════════
     A/B LOOP
  ════════════════════════════════════════════ */
  setLoopA() {
    this._loopA = this.media.currentTime;
    this.updateLoopUI();
    this.showToast(`Loop A: ${this.formatTime(this._loopA)}`, '⟨');
  }
  setLoopB() {
    this._loopB = this.media.currentTime;
    if (this._loopA !== null && this._loopB <= this._loopA) {
      this._loopB = null;
      this.showToast('Loop B must be after A', '⚠');
      return;
    }
    this.updateLoopUI();
    this.showToast(`Loop B: ${this.formatTime(this._loopB)}`, '⟩');
  }
  clearLoop(notify = true) {
    this._loopA = null; this._loopB = null;
    this.updateLoopUI();
    if (notify) this.showToast('Loop cleared', '↺');
  }
  updateLoopUI() {
    if (DOM.loopSetA) DOM.loopSetA.classList.toggle('is-active', this._loopA !== null);
    if (DOM.loopSetB) DOM.loopSetB.classList.toggle('is-active', this._loopB !== null);
    if (DOM.loopClear) DOM.loopClear.disabled = this._loopA === null && this._loopB === null;
    if (DOM.seekLoopRegion && this.media.duration) {
      if (this._loopA !== null && this._loopB !== null) {
        const pctA = (this._loopA / this.media.duration) * 100;
        const pctB = (this._loopB / this.media.duration) * 100;
        DOM.seekLoopRegion.style.left   = `${pctA}%`;
        DOM.seekLoopRegion.style.width  = `${pctB - pctA}%`;
        DOM.seekLoopRegion.hidden = false;
      } else {
        DOM.seekLoopRegion.hidden = true;
      }
    }
  }
  checkLoopBoundary() {
    if (this._loopA === null || this._loopB === null) return;
    if (this.media.currentTime >= this._loopB) {
      this.media.currentTime = this._loopA;
    }
  }

  /* ════════════════════════════════════════════
     SLEEP TIMER
  ════════════════════════════════════════════ */
  resumeSleepTimerFromStorage() {
    try {
      const raw = JSON.parse(localStorage.getItem('groove-sleep') || 'null');
      if (!raw) return;
      if (raw.atTrackEnd) { this._sleepAtTrackEnd = true; this.updateSleepUI(); return; }
      const remaining = raw.endAt - Date.now();
      if (remaining > 0) this.startSleepTimer(Math.ceil(remaining / 60000));
    } catch { /* ignore */ }
  }
  startSleepTimer(value) {
    this.cancelSleepTimer(true);
    if (!value || value === '0' || value === 0) { this.updateSleepUI(); return; }
    if (value === 'end') { this._sleepAtTrackEnd = true; this.updateSleepUI(); this.showToast('Sleep after track ends', '🌙'); return; }
    const ms = Number(value) * 60000;
    this._sleepEndAt = Date.now() + ms;
    this.startSleepInterval();
    this.updateSleepUI(ms);
    localStorage.setItem('groove-sleep', JSON.stringify({ endAt: this._sleepEndAt }));
    this.showToast(`Sleep in ${value} min`, '🌙');
  }
  startSleepInterval() {
    this.stopSleepInterval();
    this._sleepInterval = setInterval(() => this.tickSleepTimer(), 1000);
  }
  tickSleepTimer() {
    if (!this._sleepEndAt) return;
    const remaining = this._sleepEndAt - Date.now();
    if (remaining <= 0) { this.finishSleepTimer(); return; }
    if (remaining <= this._sleepFadeMs) {
      this._sleepFadeFactor = remaining / this._sleepFadeMs;
      this.applyVolumeAndMute();
    }
    this.updateSleepUI(remaining);
  }
  finishSleepTimer() {
    this.media.pause();
    this._sleepFadeFactor = 1;
    this.applyVolumeAndMute();
    this.cancelSleepTimer(true);
    this.showToast('Sleep timer — paused', '🌙');
  }
  cancelSleepTimer(silent = false) {
    this._sleepEndAt = null; this._sleepAtTrackEnd = false;
    this._sleepFadeFactor = 1;
    this.stopSleepInterval();
    localStorage.removeItem('groove-sleep');
    this.updateSleepUI();
    if (!silent) this.showToast('Sleep timer cancelled', '🌙');
  }
  stopSleepInterval() {
    if (this._sleepInterval) { clearInterval(this._sleepInterval); this._sleepInterval = null; }
  }
  updateSleepUI(remainingMs = null) {
    if (!DOM.sleepRemaining) return;
    if (this._sleepAtTrackEnd) { DOM.sleepRemaining.textContent = 'After track'; return; }
    if (remainingMs === null || !this._sleepEndAt) { DOM.sleepRemaining.textContent = 'Off'; return; }
    const m = Math.ceil(remainingMs / 60000);
    DOM.sleepRemaining.textContent = m <= 0 ? 'Sleeping…' : `${m} min`;
  }

  /* ════════════════════════════════════════════
     PREAMP
  ════════════════════════════════════════════ */
  loadPreampDb() {
    const n = Number(localStorage.getItem('groove-preamp-db'));
    return isFinite(n) ? Math.max(-12, Math.min(6, n)) : 0;
  }
  dbToGain(db) { return Math.pow(10, Number(db) / 20); }
  applyPreampGain() {
    if (!this._audioCtx) return;
    const chain = this._eqFilterChains.get(this._eqMode) || [];
    // preamp is applied via output gain offset — rebuild routing applies it
    this.rebuildEqualizerRouting();
  }
  setPreampDb(db, persist = true) {
    this._preampDb = Math.max(-12, Math.min(6, Number(db)));
    if (DOM.preampBar)   DOM.preampBar.value = String(this._preampDb);
    if (DOM.preampFill) {
      const pct = ((this._preampDb + 12) / 18) * 100;
      DOM.preampFill.style.width = `${pct}%`;
      const t = DOM.preampFill.closest('.vol-track');
      if (t) t.style.setProperty('--thumb-pos', `${pct}%`);
    }
    if (DOM.preampValue) DOM.preampValue.textContent = `${this._preampDb > 0 ? '+' : ''}${this._preampDb} dB`;
    if (persist) localStorage.setItem('groove-preamp-db', String(this._preampDb));
  }

  /* ════════════════════════════════════════════
     LOUDNESS NORMALIZATION
  ════════════════════════════════════════════ */
  loadReplayGainDb() {
    try { return JSON.parse(localStorage.getItem('groove-replaygain') || '{}'); } catch { return {}; }
  }
  setLoudnessEnabled(enabled, persist = true) {
    this._loudnessEnabled = Boolean(enabled);
    if (DOM.loudnessToggle) DOM.loudnessToggle.checked = this._loudnessEnabled;
    if (persist) localStorage.setItem('groove-loudness-on', this._loudnessEnabled ? '1' : '0');
  }

  /* ════════════════════════════════════════════
     PARAMETRIC EQ
  ════════════════════════════════════════════ */
  loadPeqBands() {
    try {
      const saved = JSON.parse(localStorage.getItem('groove-peq-bands') || 'null');
      if (Array.isArray(saved) && saved.length === 5) return saved;
    } catch { /* ignore */ }
    return [60, 250, 1000, 4000, 12000].map((freq) => ({ freq, gain: 0, q: 1 }));
  }
  savePeqBands() { localStorage.setItem('groove-peq-bands', JSON.stringify(this._peqBands)); }
  ensurePeqFilters() {
    if (!this._audioCtx) return [];
    if (this._peqFilters && this._peqFilters.length === this._peqBands.length) return this._peqFilters;
    this._peqFilters = this._peqBands.map((b) => {
      const f = this._audioCtx.createBiquadFilter();
      f.type = 'peaking'; f.frequency.value = b.freq; f.gain.value = b.gain; f.Q.value = b.q || 1;
      return f;
    });
    return this._peqFilters;
  }
  disconnectPeqFilters() {
    if (!this._peqFilters) return;
    this._peqFilters.forEach((f) => { try { f.disconnect(); } catch { /* ignore */ } });
  }
  setPeqEnabled(enabled, persist = true) {
    this._peqEnabled = Boolean(enabled);
    if (DOM.peqToggle) DOM.peqToggle.checked = this._peqEnabled;
    this.rebuildEqualizerRouting();
    if (persist) localStorage.setItem('groove-peq-on', this._peqEnabled ? '1' : '0');
  }
  updatePeqBandParam(index, key, value) {
    if (!this._peqBands[index]) return;
    this._peqBands[index][key] = Number(value);
    if (this._peqFilters && this._peqFilters[index]) {
      const f = this._peqFilters[index];
      if (key === 'freq') f.frequency.value = value;
      else if (key === 'gain') f.gain.value = value;
      else if (key === 'q') f.Q.value = value;
    }
    this.savePeqBands();
  }
  renderPeqBandsUI() {
    if (!DOM.peqBands) return;
    DOM.peqBands.innerHTML = '';
    this._peqBands.forEach((band, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'peq-band';
      wrap.innerHTML = `
        <label class="peq-band__label">Band ${i + 1}</label>
        <input class="peq-freq" type="range" min="0" max="100" step="0.1" value="${Math.log(band.freq / 20) / Math.log(1000) * 100}" aria-label="Freq band ${i+1}" />
        <span class="peq-freq-value">${band.freq >= 1000 ? (band.freq/1000).toFixed(1) + 'k' : band.freq}Hz</span>
        <input class="peq-gain" type="range" min="-12" max="12" step="0.5" value="${band.gain}" aria-label="Gain band ${i+1}" />
        <span class="peq-gain-value">${band.gain > 0 ? '+' : ''}${band.gain} dB</span>`;
      const freqIn = wrap.querySelector('.peq-freq');
      const freqOut = wrap.querySelector('.peq-freq-value');
      const gainIn = wrap.querySelector('.peq-gain');
      const gainOut = wrap.querySelector('.peq-gain-value');
      freqIn.addEventListener('input', () => {
        const freq = Math.round(20 * Math.pow(1000, Number(freqIn.value) / 100));
        freqOut.textContent = freq >= 1000 ? `${(freq/1000).toFixed(1)}kHz` : `${freq}Hz`;
        this.updatePeqBandParam(i, 'freq', freq);
      });
      gainIn.addEventListener('input', () => {
        const g = Number(gainIn.value);
        gainOut.textContent = `${g > 0 ? '+' : ''}${g} dB`;
        this.updatePeqBandParam(i, 'gain', g);
      });
      DOM.peqBands.appendChild(wrap);
    });
  }

  /* ════════════════════════════════════════════
     CROSSFEED
  ════════════════════════════════════════════ */
  loadCrossfeedAmount() {
    const n = Number(localStorage.getItem('groove-crossfeed-amount'));
    return isFinite(n) ? Math.max(0, Math.min(100, n)) : 45;
  }
  ensureCrossfeedNodes() {
    if (!this._audioCtx || this._crossfeedNodes) return this._crossfeedNodes;
    const delay = this._audioCtx.createDelay(0.01);
    const merge = this._audioCtx.createChannelMerger(2);
    const split = this._audioCtx.createChannelSplitter(2);
    const gainL = this._audioCtx.createGain();
    const gainR = this._audioCtx.createGain();
    delay.delayTime.value = 0.0007;
    this._crossfeedNodes = { delay, merge, split, gainL, gainR };
    return this._crossfeedNodes;
  }
  applyCrossfeedAmount() {
    if (!this._crossfeedNodes) return;
    const g = (this._crossfeedAmount / 100) * 0.4;
    this._crossfeedNodes.gainL.gain.value = g;
    this._crossfeedNodes.gainR.gain.value = g;
  }
  connectCrossfeed(inputNode) {
    const n = this.ensureCrossfeedNodes();
    if (!n) return inputNode;
    inputNode.connect(n.split);
    n.split.connect(n.gainL, 0); n.split.connect(n.gainR, 1);
    n.gainL.connect(n.delay); n.gainR.connect(n.delay);
    n.delay.connect(n.merge, 0, 1); n.delay.connect(n.merge, 0, 0);
    n.split.connect(n.merge, 0, 0); n.split.connect(n.merge, 1, 1);
    this.applyCrossfeedAmount();
    return n.merge;
  }
  disconnectCrossfeedNodes() {
    if (!this._crossfeedNodes) return;
    Object.values(this._crossfeedNodes).forEach((n) => { try { n.disconnect(); } catch { /* ignore */ } });
  }
  setCrossfeedEnabled(enabled, persist = true) {
    this._crossfeedEnabled = Boolean(enabled);
    if (DOM.crossfeedToggle) DOM.crossfeedToggle.checked = this._crossfeedEnabled;
    this.rebuildEqualizerRouting();
    if (persist) localStorage.setItem('groove-crossfeed-on', this._crossfeedEnabled ? '1' : '0');
  }
  setCrossfeedAmount(value, persist = true) {
    this._crossfeedAmount = Math.max(0, Math.min(100, Number(value)));
    this.applyCrossfeedAmount();
    if (DOM.crossfeedValue) DOM.crossfeedValue.textContent = `${Math.round(this._crossfeedAmount)}%`;
    if (DOM.crossfeedBar)   DOM.crossfeedBar.value = String(this._crossfeedAmount);
    if (persist) localStorage.setItem('groove-crossfeed-amount', String(this._crossfeedAmount));
  }

  /* ════════════════════════════════════════════
     CONVOLUTION DSP
  ════════════════════════════════════════════ */
  loadConvolverMix() {
    const n = Number(localStorage.getItem('groove-convolver-mix'));
    return isFinite(n) ? Math.max(0, Math.min(100, n)) : 25;
  }
  ensureConvolverNodes() {
    if (!this._audioCtx || this._convolverNodes) return this._convolverNodes;
    const conv = this._audioCtx.createConvolver();
    const dry  = this._audioCtx.createGain();
    const wet  = this._audioCtx.createGain();
    const out  = this._audioCtx.createGain();
    this._convolverNodes = { conv, dry, wet, out };
    this._loadConvolverIR();
    return this._convolverNodes;
  }
  _convolverNodesReady() { return !!(this._convolverNodes && this._convolverNodes.conv); }
  _loadConvolverIR() {
    if (!this._audioCtx || !this._convolverNodes) return;
    this.generateSyntheticIR(this._convolverSpace);
  }
  generateSyntheticIR(spaceKey) {
    if (!this._audioCtx || !this._convolverNodes) return;
    const spaces = { smallRoom: { s: 0.6, d: 3.2 }, hall: { s: 2.4, d: 5.5 }, plate: { s: 1.3, d: 6.5 } };
    const { s: seconds = 1, d: decay = 4 } = spaces[spaceKey] || spaces.smallRoom;
    const len = Math.floor(this._audioCtx.sampleRate * seconds);
    const buf = this._audioCtx.createBuffer(2, len, this._audioCtx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    this._convolverNodes.conv.buffer = buf;
  }
  connectConvolver(inputNode) {
    const n = this.ensureConvolverNodes();
    if (!n) return inputNode;
    const mix = this._convolverMix / 100;
    n.dry.gain.value = 1 - mix; n.wet.gain.value = mix;
    inputNode.connect(n.dry); inputNode.connect(n.conv);
    n.conv.connect(n.wet); n.dry.connect(n.out); n.wet.connect(n.out);
    return n.out;
  }
  disconnectConvolverNodes() {
    if (!this._convolverNodes) return;
    Object.values(this._convolverNodes).forEach((n) => { try { n.disconnect(); } catch { /* ignore */ } });
  }
  applyConvolverMix() {
    if (!this._convolverNodes) return;
    const mix = this._convolverMix / 100;
    this._convolverNodes.dry.gain.value = 1 - mix;
    this._convolverNodes.wet.gain.value = mix;
  }
  setConvolverMix(value, persist = true) {
    this._convolverMix = Math.max(0, Math.min(100, Number(value)));
    this.applyConvolverMix();
    if (DOM.convolverMixBar)   DOM.convolverMixBar.value = String(this._convolverMix);
    if (DOM.convolverMixValue) DOM.convolverMixValue.textContent = `${Math.round(this._convolverMix)}%`;
    if (persist) localStorage.setItem('groove-convolver-mix', String(this._convolverMix));
  }
  setConvolverEnabled(enabled, persist = true) {
    this._convolverEnabled = Boolean(enabled);
    if (DOM.convolverToggle) DOM.convolverToggle.checked = this._convolverEnabled;
    this.rebuildEqualizerRouting();
    if (persist) localStorage.setItem('groove-convolver-on', this._convolverEnabled ? '1' : '0');
  }
  setConvolverSpace(spaceKey, persist = true) {
    this._convolverSpace = spaceKey;
    if (this._convolverNodes) this.generateSyntheticIR(spaceKey);
    if (persist) localStorage.setItem('groove-convolver-space', spaceKey);
  }

  /* ════════════════════════════════════════════
     GAPLESS PLAYBACK
  ════════════════════════════════════════════ */
  setGaplessEnabled(enabled, persist = true) {
    this._gaplessEnabled = Boolean(enabled);
    if (DOM.gaplessToggle) DOM.gaplessToggle.checked = this._gaplessEnabled;
    if (persist) localStorage.setItem('groove-gapless-off', this._gaplessEnabled ? '0' : '1');
  }

  /* ════════════════════════════════════════════
     PER-TRACK DSP PROFILES
  ════════════════════════════════════════════ */
  loadTrackDspProfiles() {
    try { return JSON.parse(localStorage.getItem('groove-dsp-profiles') || '{}'); } catch { return {}; }
  }
  saveTrackDspProfiles() {
    localStorage.setItem('groove-dsp-profiles', JSON.stringify(this._trackDspProfiles));
  }
  saveCurrentTrackDspProfile() {
    const track = this.playlist[this.currentIndex];
    if (!track) return;
    this._trackDspProfiles[track.src] = {
      peqEnabled: this._peqEnabled, peqBands: JSON.parse(JSON.stringify(this._peqBands)),
      crossfeedEnabled: this._crossfeedEnabled, crossfeedAmount: this._crossfeedAmount,
      convolverEnabled: this._convolverEnabled, convolverSpace: this._convolverSpace, convolverMix: this._convolverMix,
      speed: this._speed,
    };
    this.saveTrackDspProfiles();
  }
  applyTrackDspProfile(track) {
    const p = track && this._trackDspProfiles[track.src];
    if (!p) return;
    this._suppressDspProfileCapture = true;
    if (Array.isArray(p.peqBands) && p.peqBands.length === 5) { this._peqBands = p.peqBands; this._peqFilters = null; this.renderPeqBandsUI(); }
    this.setPeqEnabled(Boolean(p.peqEnabled), false);
    this.setCrossfeedAmount(p.crossfeedAmount ?? this._crossfeedAmount, false);
    this.setCrossfeedEnabled(Boolean(p.crossfeedEnabled), false);
    if (p.convolverSpace) this.setConvolverSpace(p.convolverSpace, false);
    this.setConvolverMix(p.convolverMix ?? this._convolverMix, false);
    this.setConvolverEnabled(Boolean(p.convolverEnabled), false);
    if (p.speed) this.applySpeed(p.speed, false);
    this._suppressDspProfileCapture = false;
  }

  /* ════════════════════════════════════════════
     BOOKMARKS
  ════════════════════════════════════════════ */
  loadBookmarks() {
    try { return JSON.parse(localStorage.getItem('groove-bookmarks') || '{}'); } catch { return {}; }
  }
  saveBookmarksStorage() { localStorage.setItem('groove-bookmarks', JSON.stringify(this._bookmarks)); }
  getCurrentBookmarks() { const t = this.playlist[this.currentIndex]; return t ? (this._bookmarks[t.src] || []) : []; }
  addBookmark() {
    const t = this.playlist[this.currentIndex]; if (!t) return;
    const time = Math.floor(this.media.currentTime);
    if (!this._bookmarks[t.src]) this._bookmarks[t.src] = [];
    if (!this._bookmarks[t.src].includes(time)) { this._bookmarks[t.src].push(time); this._bookmarks[t.src].sort((a,b)=>a-b); }
    this.saveBookmarksStorage(); this.renderBookmarksUI();
    this.showToast(`Bookmark: ${this.formatTime(time)}`, '🔖');
  }
  removeBookmark(time) {
    const t = this.playlist[this.currentIndex]; if (!t || !this._bookmarks[t.src]) return;
    this._bookmarks[t.src] = this._bookmarks[t.src].filter((b) => b !== time);
    this.saveBookmarksStorage(); this.renderBookmarksUI();
  }
  renderBookmarksUI() {
    if (!DOM.bookmarksList) return;
    const bms = this.getCurrentBookmarks();
    DOM.bookmarksList.innerHTML = '';
    bms.forEach((time) => {
      const btn = document.createElement('button');
      btn.className = 'bookmark-chip';
      btn.textContent = this.formatTime(time);
      btn.title = `Jump to ${this.formatTime(time)}`;
      btn.addEventListener('click', () => { this.media.currentTime = time; });
      const del = document.createElement('button');
      del.className = 'bookmark-chip__del'; del.textContent = '×'; del.title = 'Remove';
      del.addEventListener('click', (e) => { e.stopPropagation(); this.removeBookmark(time); });
      btn.appendChild(del); DOM.bookmarksList.appendChild(btn);
    });
  }

  /* ════════════════════════════════════════════
     ABX BLIND TEST
  ════════════════════════════════════════════ */
  startAbxRound() {
    if (!this._audioCtx || !this._audioGraphConnected) { this.showToast('Start playback first', '⚠'); return; }
    this._abx.active = true; this._abx.x = Math.random() < 0.5 ? 'A' : 'B'; this._abx.currentlyBypassed = null;
    if (DOM.abxChoices) DOM.abxChoices.hidden = false;
    if (DOM.abxStartBtn) DOM.abxStartBtn.textContent = 'New round';
    if (DOM.abxStatus) DOM.abxStatus.textContent = 'X is hidden — press "Play X" to audition, then guess.';
  }
  playAbxX() {
    if (!this._abx.active) return;
    const bypass = this._abx.x === 'A';
    this._dspBypassed = bypass; this.rebuildEqualizerRouting();
    this._abx.currentlyBypassed = bypass;
    if (!this.isPlaying) this.play();
    this.showToast('Listening to X…', '🎧');
  }
  guessAbx(guess) {
    if (!this._abx.active || this._abx.currentlyBypassed === null) { this.showToast('Play X first', '⚠'); return; }
    const correct = guess === this._abx.x;
    this._abx.score.total++; if (correct) this._abx.score.correct++;
    this._dspBypassed = false; this.rebuildEqualizerRouting(); this._abx.active = false;
    if (DOM.abxChoices) DOM.abxChoices.hidden = true;
    if (DOM.abxStartBtn) DOM.abxStartBtn.textContent = 'Start round';
    const xWas = this._abx.x === 'A' ? 'DSP off' : 'your chain';
    if (DOM.abxStatus) DOM.abxStatus.textContent = correct ? `Correct! X was ${xWas}.` : `Not quite — X was ${xWas}.`;
    if (DOM.abxScore) { DOM.abxScore.hidden = false; DOM.abxScore.textContent = `Score: ${this._abx.score.correct} / ${this._abx.score.total}`; }
  }

  /* ════════════════════════════════════════════
     VISUALIZER MODE
  ════════════════════════════════════════════ */
  setVizMode(mode) {
    this._vizMode = mode;
    localStorage.setItem('groove-viz-mode', mode);
    if (DOM.vizWaveBtn)     DOM.vizWaveBtn.classList.toggle('is-active', mode === 'wave');
    if (DOM.vizSpectrumBtn) DOM.vizSpectrumBtn.classList.toggle('is-active', mode === 'spectrum');
  }

  /* ════════════════════════════════════════════
     SHORTCUTS MODAL
  ════════════════════════════════════════════ */
  openShortcuts() { if (DOM.shortcutsModal) { DOM.shortcutsModal.hidden = false; DOM.shortcutsOverlay.hidden = false; } }
  closeShortcuts() { if (DOM.shortcutsModal) { DOM.shortcutsModal.hidden = true; DOM.shortcutsOverlay.hidden = true; } }
  toggleShortcuts() { if (DOM.shortcutsModal) { if (DOM.shortcutsModal.hidden) this.openShortcuts(); else this.closeShortcuts(); } }

  /* ════════════════════════════════════════════
     PICTURE-IN-PICTURE
  ════════════════════════════════════════════ */
  updatePipButtonVisibility() { if (DOM.pipBtn) DOM.pipBtn.hidden = true; }
  async togglePictureInPicture() { /* requires HTTP — no-op on file:// */ }

  /* ════════════════════════════════════════════
     RESUME STATE
  ════════════════════════════════════════════ */
  loadResumeState() {
    try {
      const raw = JSON.parse(localStorage.getItem('groove-resume') || '{}');
      const index = this.playlist.findIndex((t) => t.src === raw.src);
      if (index === -1) return { index: 0, time: 0 };
      const time = Number(raw.time);
      return { index, time: isFinite(time) && time > 0 ? time : 0 };
    } catch { return { index: 0, time: 0 }; }
  }
  saveResumeState() {
    const track = this.playlist[this.currentIndex];
    if (!track) return;
    localStorage.setItem('groove-resume', JSON.stringify({ src: track.src, time: this.media.currentTime || 0 }));
  }

  /* ════════════════════════════════════════════
     EXTRA FEATURE BINDINGS
  ════════════════════════════════════════════ */
  bindExtraFeatures() {
    if (DOM.favoriteBtn) DOM.favoriteBtn.addEventListener('click', () => this.toggleFavorite());
    if (DOM.trackSearch) DOM.trackSearch.addEventListener('input', () => { this._searchQuery = DOM.trackSearch.value; this.applyFilters(); });
    if (DOM.favFilterBtn) DOM.favFilterBtn.addEventListener('click', () => this.toggleFavoritesFilter());
    if (DOM.speedBar) DOM.speedBar.addEventListener('input', () => this.applySpeed(Number(DOM.speedBar.value), true));
    if (DOM.loopSetA) DOM.loopSetA.addEventListener('click', () => this.setLoopA());
    if (DOM.loopSetB) DOM.loopSetB.addEventListener('click', () => this.setLoopB());
    if (DOM.loopClear) DOM.loopClear.addEventListener('click', () => this.clearLoop());
    if (DOM.muteBtn) DOM.muteBtn.addEventListener('click', () => this.toggleMute());
    if (DOM.volumeBar) {
      DOM.volumeBar.addEventListener('input', () => { this._applyVolumeSlider(DOM.volumeBar.value, false); this.applyVolumeAndMute(); });
      DOM.volumeBar.addEventListener('change', () => { this._applyVolumeSlider(DOM.volumeBar.value, true); this.applyVolumeAndMute(); });
    }
    if (DOM.sleepTimerOptions) {
      DOM.sleepTimerOptions.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip'); if (!chip) return;
        const v = chip.dataset.sleep;
        this.startSleepTimer(v === '0' ? 0 : (v === 'end' ? 'end' : Number(v)));
      });
    }
    if (DOM.shortcutsBtn) DOM.shortcutsBtn.addEventListener('click', () => this.openShortcuts());
    if (DOM.shortcutsClose) DOM.shortcutsClose.addEventListener('click', () => this.closeShortcuts());
    if (DOM.shortcutsOverlay) DOM.shortcutsOverlay.addEventListener('click', () => this.closeShortcuts());
    if (DOM.preampBar) DOM.preampBar.addEventListener('input', () => this.setPreampDb(Number(DOM.preampBar.value), true));
    if (DOM.peqToggle) DOM.peqToggle.addEventListener('change', () => this.setPeqEnabled(DOM.peqToggle.checked, true));
    if (DOM.crossfeedToggle) DOM.crossfeedToggle.addEventListener('change', () => this.setCrossfeedEnabled(DOM.crossfeedToggle.checked, true));
    if (DOM.crossfeedBar) DOM.crossfeedBar.addEventListener('input', () => this.setCrossfeedAmount(DOM.crossfeedBar.value, true));
    if (DOM.convolverToggle) DOM.convolverToggle.addEventListener('change', () => this.setConvolverEnabled(DOM.convolverToggle.checked, true));
    if (DOM.convolverSpace) DOM.convolverSpace.addEventListener('change', () => this.setConvolverSpace(DOM.convolverSpace.value, true));
    if (DOM.convolverMixBar) DOM.convolverMixBar.addEventListener('input', () => this.setConvolverMix(DOM.convolverMixBar.value, true));
    if (DOM.loudnessToggle) DOM.loudnessToggle.addEventListener('change', () => this.setLoudnessEnabled(DOM.loudnessToggle.checked, true));
    if (DOM.gaplessToggle) DOM.gaplessToggle.addEventListener('change', () => this.setGaplessEnabled(DOM.gaplessToggle.checked, true));
    if (DOM.abxStartBtn) DOM.abxStartBtn.addEventListener('click', () => this.startAbxRound());
    if (DOM.abxPlayXBtn) DOM.abxPlayXBtn.addEventListener('click', () => this.playAbxX());
    if (DOM.abxGuessABtn) DOM.abxGuessABtn.addEventListener('click', () => this.guessAbx('A'));
    if (DOM.abxGuessBBtn) DOM.abxGuessBBtn.addEventListener('click', () => this.guessAbx('B'));
    if (DOM.vizWaveBtn) DOM.vizWaveBtn.addEventListener('click', () => this.setVizMode('wave'));
    if (DOM.vizSpectrumBtn) DOM.vizSpectrumBtn.addEventListener('click', () => this.setVizMode('spectrum'));
    if (DOM.bookmarkAddBtn) DOM.bookmarkAddBtn.addEventListener('click', () => this.addBookmark());
    if (DOM.pipBtn) DOM.pipBtn.addEventListener('click', () => this.togglePictureInPicture());
  }
}

/* ════════════════════════════════════════════════
   4. BOOT
════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  window.groove = new GroovePlayer(PLAYLIST);
});

/*
  ═══════════════════════════════════════════════════
  HOW TO ADD MORE TRACKS
  ─────────────────────────────────────────────────
  1. Add the MP3 file to the "tracks/" folder.
  2. (Optional) Add cover art to "covers/" folder.
  3. Push a new object into the PLAYLIST array:

     {
       title:  'My Song',
       artist: 'My Artist',
       album:  'My Album',        // optional
       src:    'tracks/my.mp3',
       cover:  'covers/my.jpg',   // optional
     },

  4. Add 'tracks/my.mp3' to PRECACHE_ASSETS in
     service-worker.js so it works offline.
  ═══════════════════════════════════════════════════
*/
