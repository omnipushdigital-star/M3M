import clsx from 'clsx'

/**
 * AdSlot — reserved placeholder for a future monetization integration
 * (AdSense, AdMob, Adsterra, a custom sponsored card, etc.).
 *
 * It is OFF by default and renders nothing, so a half-built app never
 * shows a blank gray box to residents. Flip `ADS_ENABLED` in
 * src/lib/ads-config.js to `true` to activate all slots at once.
 *
 * When enabled, the slot renders at a fixed aspect so that content
 * above/below doesn't reflow when the ad eventually loads — avoiding
 * layout shift (CLS).
 *
 * Sizes tuned for the app's `max-w-2xl` mobile-first container:
 *   - "banner"     → 320×50   / responsive fluid   (top of Home)
 *   - "leaderboard"→ 728×90 on md+, 320×100 on mobile (section breaks)
 *   - "square"     → 300×250 (inline feed card)
 *   - "sticky"     → 320×50  (pinned above BottomNav)
 *
 * When you integrate a real ad network, replace the inner <!-- slot -->
 * block with the network's `<ins>` tag / iframe, keyed on `slotId`.
 */

import { ADS_ENABLED, AD_UNIT_IDS, showDebugFrames } from '../../lib/ads-config.js'

const SIZE_CLASSES = {
  banner:      'h-[60px] md:h-[90px]',
  leaderboard: 'h-[100px] md:h-[90px]',
  square:      'h-[250px] w-full max-w-[300px] mx-auto',
  sticky:      'h-[56px]'
}

export default function AdSlot({
  size = 'banner',
  slotId,                // logical id — e.g., "home_top", "hiring_inline"
  className,
  label = 'Advertisement'
}) {
  if (!ADS_ENABLED && !showDebugFrames) return null

  const unitId = slotId ? AD_UNIT_IDS[slotId] : undefined

  return (
    <div
      data-ad-slot={slotId || size}
      data-ad-unit={unitId || ''}
      className={clsx(
        'w-full rounded-xl bg-slate-100 border border-dashed border-slate-300',
        'flex items-center justify-center text-[10px] tracking-wide uppercase text-slate-400',
        SIZE_CLASSES[size] || SIZE_CLASSES.banner,
        className
      )}
      aria-label={label}
    >
      {showDebugFrames ? `Ad · ${slotId || size}` : null}
      {/* network <ins> / iframe goes here when ADS_ENABLED is true */}
    </div>
  )
}

/**
 * StickyAdBar — a bottom banner that stays above the BottomNav (z-30).
 * Use once in the Layout when you're ready to deploy a persistent house ad.
 */
export function StickyAdBar({ slotId = 'sticky_bottom' }) {
  if (!ADS_ENABLED && !showDebugFrames) return null
  return (
    <div className="fixed inset-x-0 bottom-[64px] z-30 px-3">
      <div className="max-w-2xl mx-auto">
        <AdSlot size="sticky" slotId={slotId} className="shadow-card bg-white"/>
      </div>
    </div>
  )
}
