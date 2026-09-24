/**
 * UpgradePage.jsx
 * Full-page premium upgrade / pricing screen.
 * Accessible from every "Upgrade to Pro" button across the app.
 * Uses existing design tokens exclusively.
 *
 * Layout:
 *   Header strip    — back button + breadcrumb
 *   Hero section    — headline, sub, badge
 *   Plans row       — Free (current) vs Pro (highlighted)
 *   Feature grid    — 6 feature cards
 *   FAQ strip       — 3 common questions
 *   Footer CTA      — final upgrade call to action
 */

import { useState } from 'react'
import Card      from '../components/ui/Card'
import Button    from '../components/ui/Button'
import MaterialIcon from '../components/ui/MaterialIcon'

// ─────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────
const FREE_FEATURES = [
  'Dashboard & usage overview',
  'Usage Insights (weekly & monthly)',
  'Applications module',
  'Website Usage tracking',
  'Focus Mode (view only)',
  '90-day data history',
  'Local storage only',
]

const PRO_FEATURES = [
  { icon: 'center_focus_strong', label: 'Unlimited Focus Sessions',  desc: 'Start, pause and resume sessions anytime.'             },
  { icon: 'block',               label: 'App & Website Blocking',    desc: 'Block apps and sites on a schedule or on demand.'      },
  { icon: 'timer_off',           label: 'Daily Usage Limits',        desc: 'Set per-app and per-site daily time caps.'             },
  { icon: 'event_busy',          label: 'Scheduled Blocking',        desc: 'Auto-block distractions during your work hours.'       },
  { icon: 'psychology',          label: 'AI Insights',               desc: 'Personalised observations from your activity data.'    },
  { icon: 'cloud_sync',          label: 'Cloud Sync',                desc: 'Access your data across multiple Windows devices.'     },
  { icon: 'bar_chart',           label: 'Advanced Analytics',        desc: 'Detailed breakdowns, comparisons and heatmaps.'        },
  { icon: 'history',             label: 'Unlimited History',         desc: 'Keep your usage records for as long as you need.'      },
  { icon: 'notifications_active',label: 'Smart Notifications',       desc: 'Goal alerts, focus reminders and weekly reports.'      },
]

const FAQS = [
  {
    q: 'Does Clarity send my data anywhere?',
    a: 'All data is stored locally on your device by default. Cloud Sync (Pro) is opt-in and encrypted end-to-end.',
  },
  {
    q: 'Can I cancel my Pro subscription?',
    a: 'Yes. You can cancel anytime from Settings → Account. Your data remains accessible on the Free plan after cancellation.',
  },
  {
    q: 'Is Pro a one-time purchase or a subscription?',
    a: 'Pro is available as a monthly or yearly subscription. Yearly saves you 40% compared to monthly billing.',
  },
]

const BILLING_TABS = ['Monthly', 'Yearly']

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

const CheckItem = ({ label, muted = false }) => (
  <div className="flex items-start gap-3">
    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-primary-container/20">
      <MaterialIcon name="check" size="text-xs" className="text-primary" />
    </div>
    <span className={`text-[13px] ${muted ? 'text-outline line-through' : 'text-on-surface-variant'}`}>
      {label}
    </span>
  </div>
)

const FeatureCard = ({ item }) => (
  <Card className="p-5 flex flex-col gap-3" hoverable={false}>
    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary-container/10 flex-shrink-0">
      <MaterialIcon name={item.icon} size="text-lg" className="text-primary" />
    </div>
    <div>
      <p className="text-[14px] font-bold text-on-surface mb-1">{item.label}</p>
      <p className="text-[12px] text-on-surface-variant leading-relaxed">{item.desc}</p>
    </div>
  </Card>
)

const FaqItem = ({ item }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-outline-variant/20 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 hover:text-primary transition-colors"
      >
        <span className="text-[14px] font-semibold text-on-surface">{item.q}</span>
        <MaterialIcon
          name={open ? 'expand_less' : 'expand_more'}
          size="text-lg"
          className={`flex-shrink-0 transition-colors ${open ? 'text-primary' : 'text-outline'}`}
        />
      </button>
      {open && (
        <p className="pb-4 text-[13px] text-on-surface-variant leading-relaxed">{item.a}</p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────
const UpgradePage = ({ onBack }) => {
  const [billing, setBilling] = useState('Yearly')

  const monthlyPrice = billing === 'Monthly' ? '4.99' : '2.99'
  const yearlyTotal  = billing === 'Yearly'  ? '35.88' : null

  return (
    <div className="flex flex-col min-h-full bg-surface-dim text-on-surface">

      {/* ── Sticky sub-header ─────────────────────────── */}
      <div className="
        flex items-center justify-between h-14 px-8
        sticky top-0 z-40 flex-shrink-0
        bg-surface/80 backdrop-blur-md
        border-b border-outline-variant/30
      ">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-[12px] font-semibold text-on-surface-variant hover:text-primary transition-colors"
            >
              <MaterialIcon name="chevron_left" size="text-lg" />
              Back
            </button>
          )}
          <span className="text-outline-variant/60">·</span>
          <span className="text-[13px] text-outline">Upgrade to Pro</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-on-surface-variant">
          <MaterialIcon name="lock" size="text-sm" className="text-primary" />
          Secure checkout
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="px-8 py-10 max-w-[1100px] mx-auto w-full space-y-14">

          {/* ── Hero ───────────────────────────────────── */}
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-container/10 border border-primary/20">
                <MaterialIcon name="workspace_premium" size="text-base" className="text-tertiary" filled />
                <span className="text-[12px] font-bold text-on-surface uppercase tracking-widest">
                  Clarity Pro
                </span>
              </div>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              Take full control of your digital time
            </h1>
            <p className="text-[16px] text-on-surface-variant max-w-xl mx-auto leading-relaxed">
              Clarity Pro gives you the tools to understand your habits, eliminate distractions,
              and build a healthier relationship with your screen — on your terms.
            </p>
          </div>

          {/* ── Billing toggle ─────────────────────────── */}
          <div className="flex justify-center">
            <div className="flex gap-0.5 p-1 rounded-xl bg-surface-variant/30">
              {BILLING_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setBilling(tab)}
                  className={[
                    'px-6 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 flex items-center gap-2',
                    billing === tab
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface',
                  ].join(' ')}
                >
                  {tab}
                  {tab === 'Yearly' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-tertiary/20 text-tertiary">
                      −40%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Plans row ──────────────────────────────── */}
          <div className="grid grid-cols-2 gap-6 max-w-[760px] mx-auto">

            {/* Free plan */}
            <Card className="p-7 flex flex-col gap-6" hoverable={false}>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-outline mb-2">Current Plan</p>
                <p className="text-[28px] font-bold text-on-surface">Free</p>
                <p className="text-[13px] text-on-surface-variant mt-1">
                  Core usage tracking, always free.
                </p>
              </div>

              <div className="space-y-3">
                {FREE_FEATURES.map(f => <CheckItem key={f} label={f} />)}
              </div>

              <button
                disabled
                className="w-full py-3 rounded-xl text-[13px] font-semibold border border-outline-variant/30 text-outline cursor-not-allowed mt-auto"
              >
                Current Plan
              </button>
            </Card>

            {/* Pro plan */}
            <div className="relative">
              {/* Glow border */}
              <div className="absolute -inset-px rounded-2xl bg-primary/20 blur-sm pointer-events-none" />
              <Card className="relative p-7 flex flex-col gap-6 border border-primary/40" hoverable={false}>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Pro Plan</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-container/20 text-primary border border-primary/20">
                      RECOMMENDED
                    </span>
                  </div>
                  <div className="flex items-end gap-1.5">
                    <p className="text-[32px] font-bold text-on-surface">${monthlyPrice}</p>
                    <p className="text-[13px] text-on-surface-variant mb-1.5">/month</p>
                  </div>
                  {yearlyTotal && (
                    <p className="text-[12px] text-outline mt-0.5">Billed as ${yearlyTotal}/year</p>
                  )}
                  <p className="text-[13px] text-on-surface-variant mt-1.5">
                    Everything in Free, plus all Pro features.
                  </p>
                </div>

                <div className="space-y-3">
                  {FREE_FEATURES.map(f => <CheckItem key={f} label={f} />)}
                  <div className="pt-2 border-t border-outline-variant/20 space-y-3">
                    {PRO_FEATURES.slice(0, 5).map(f => <CheckItem key={f.label} label={f.label} />)}
                    <p className="text-[12px] text-primary font-medium">+ 4 more Pro features below ↓</p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full justify-center py-3.5 rounded-xl text-[14px] font-bold mt-auto"
                >
                  <MaterialIcon name="workspace_premium" size="text-base" className="text-on-primary" filled />
                  Upgrade to Pro
                </Button>

                <p className="text-center text-[11px] text-outline -mt-2">
                  Cancel anytime · No commitment
                </p>
              </Card>
            </div>
          </div>

          {/* ── Feature grid ───────────────────────────── */}
          <div>
            <div className="text-center mb-8">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-2">
                Everything included in Pro
              </h2>
              <p className="text-[14px] text-on-surface-variant">
                Unlock the full Clarity experience with all features enabled.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {PRO_FEATURES.map(item => (
                <FeatureCard key={item.label} item={item} />
              ))}
            </div>
          </div>

          {/* ── Social proof strip ─────────────────────── */}
          <Card className="p-6" hoverable={false}>
            <div className="grid grid-cols-3 gap-6 divide-x divide-outline-variant/20">
              {[
                { stat: '100%', label: 'Local by default',    sub: 'Your data never leaves your device unless you opt in to sync.' },
                { stat: 'No ads', label: 'Always ad-free',    sub: 'Clarity earns revenue through subscriptions only, never ads.'  },
                { stat: '1 click', label: 'Cancel anytime',   sub: 'No long contracts. Cancel from Settings in under a minute.'    },
              ].map(({ stat, label, sub }) => (
                <div key={label} className="px-6 first:pl-0 last:pr-0">
                  <p className="text-[28px] font-bold text-primary mb-0.5">{stat}</p>
                  <p className="text-[14px] font-semibold text-on-surface mb-1">{label}</p>
                  <p className="text-[12px] text-on-surface-variant leading-relaxed">{sub}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* ── FAQ ────────────────────────────────────── */}
          <div className="max-w-[720px] mx-auto">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-6 text-center">
              Frequently asked questions
            </h2>
            <Card className="px-6 py-2" hoverable={false}>
              {FAQS.map(faq => <FaqItem key={faq.q} item={faq} />)}
            </Card>
          </div>

          {/* ── Footer CTA ─────────────────────────────── */}
          <div className="text-center pb-8 space-y-5">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Ready to take control?
            </h2>
            <p className="text-[14px] text-on-surface-variant">
              Join Clarity Pro today. Cancel anytime, no questions asked.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="primary"
                className="px-8 py-3.5 rounded-xl text-[15px] font-bold"
              >
                <MaterialIcon name="workspace_premium" size="text-base" className="text-on-primary" filled />
                Upgrade to Pro — ${monthlyPrice}/mo
              </Button>
              {onBack && (
                <Button variant="ghost" className="px-6 py-3.5 rounded-xl text-[13px]" onClick={onBack}>
                  Maybe Later
                </Button>
              )}
            </div>
            <p className="text-[12px] text-outline">
              Secure payment · Instant activation · Cancel from Settings
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default UpgradePage
