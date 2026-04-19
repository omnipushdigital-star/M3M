// ============================================================
// Ad configuration
// ============================================================
// Flip ADS_ENABLED to `true` once you've integrated an ad network
// (AdSense / AdMob / Adsterra / PropellerAds / a house-ad server).
// While `false`, every <AdSlot /> in the app renders nothing.
//
// Flip `SHOW_DEBUG_FRAMES` to `true` during design work to see the
// reserved placeholder boxes so you can visualize placement without
// loading real ads.
//
// AD_UNIT_IDS maps logical slot names (used in <AdSlot slotId="…"/>)
// to whatever the ad network calls the unit — AdSense data-ad-slot,
// AdMob ad unit id, etc. Keep these in a single place so you can
// update them later without hunting through the codebase.
// ============================================================

export const ADS_ENABLED = false
export const SHOW_DEBUG_FRAMES = false

// Named slots placed throughout the app. Add/remove entries freely —
// the string keys are what <AdSlot slotId="…" /> looks up.
export const AD_UNIT_IDS = {
  home_top:            '',   // banner below the greeting
  home_between:        '',   // between stat grid and announcements
  issues_top:          '',
  polls_top:           '',
  hiring_top:          '',
  businesses_top:      '',
  documents_top:       '',
  sticky_bottom:       ''    // persistent bar above BottomNav (optional)
}

// Mirrored at runtime for the AdSlot component — allows toggling via
// a feature-flag service later without a rebuild if you want.
export const showDebugFrames = SHOW_DEBUG_FRAMES
