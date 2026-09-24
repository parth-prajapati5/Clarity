# Clarity — Desktop App Frontend

Productivity Engine built with **Tauri 2 · React · Vite · Tailwind CSS**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2 |
| UI framework | React 18 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Icons | Material Symbols Outlined (font) |
| Charts | Recharts |
| Language | JavaScript (ESM) |

---

## Project Structure

```
desktop-app/
├── index.html                  # Vite HTML entry, mounts #root
├── vite.config.js              # Vite + Tauri dev server config
├── tailwind.config.js          # Full design token set from approved design
├── postcss.config.js
├── package.json
│
└── src/
    ├── main.jsx                # React DOM entry point
    ├── App.jsx                 # Root component — layout + page composition
    │
    ├── styles/
    │   └── index.css           # Tailwind directives, global base styles, scrollbar
    │
    ├── data/                   # Mock data — swap for Tauri IPC calls later
    │   ├── index.js            # Barrel export
    │   ├── metrics.js          # heroMetric, secondaryMetrics
    │   ├── apps.js             # topApps
    │   ├── activities.js       # recentActivities
    │   ├── focusSessions.js    # focusHeatmap, hourlyScreenTime, weeklyScreenTime
    │   └── dashboard.js        # dashboardConfig, navItems, aiInsight
    │
    ├── layouts/
    │   └── DashboardLayout.jsx # Shell: Sidebar + TopHeader + main canvas + footer
    │
    ├── pages/
    │   └── DashboardPage.jsx   # Bento grid assembly — composes all dashboard cards
    │
    ├── components/
    │   ├── ui/                 # Reusable design-system primitives
    │   │   ├── index.js
    │   │   ├── Card.jsx        # Glass-card surface with optional hover lift
    │   │   ├── Button.jsx      # primary / ghost / text variants
    │   │   ├── Badge.jsx       # secondary / positive / neutral / tertiary
    │   │   ├── SectionTitle.jsx# Uppercase label (e.g. "Restrictions")
    │   │   └── MaterialIcon.jsx# Material Symbols wrapper with filled variant
    │   │
    │   ├── sidebar/
    │   │   ├── Sidebar.jsx     # Full sidebar: brand, nav, live status
    │   │   └── NavItem.jsx     # Single nav link with active/inactive state
    │   │
    │   ├── header/
    │   │   ├── TopHeader.jsx   # Sticky app bar composing all header elements
    │   │   ├── SearchBar.jsx   # Rounded search input with icon
    │   │   ├── NotificationButton.jsx
    │   │   └── UserProfile.jsx # Avatar with fallback initial
    │   │
    │   └── dashboard/
    │       ├── index.js
    │       ├── ProgressRing.jsx     # Dynamic SVG progress ring
    │       ├── HeroMetricCard.jsx   # Large screen-time card (col-span-5)
    │       ├── MetricCard.jsx       # Secondary metric tile (2×2 grid)
    │       ├── GreetingSection.jsx  # Greeting headline + Export/Customize
    │       ├── ScreenTimeChart.jsx  # Recharts AreaChart, Hourly/Weekly toggle
    │       ├── AIInsightCard.jsx    # AI recommendation + heatmap
    │       ├── AppUsageTable.jsx    # Top apps list with progress bars
    │       └── ActivityFeed.jsx     # Vertical timeline of recent events
    │
    ├── hooks/                  # Custom React hooks (future: useScreenTime, useFocus…)
    ├── services/               # Tauri IPC bridge functions (future)
    ├── utils/                  # Pure helper functions (future: formatDuration…)
    └── constants/              # App-wide constants (future: routes, IPC channels…)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Rust + Cargo (for Tauri)
- `@tauri-apps/cli` v2

### Install dependencies

```bash
npm install
```

### Run in browser (UI only, no Tauri)

```bash
npm run dev
```

Open `http://localhost:1420`

### Run with Tauri (full desktop app)

```bash
npm run tauri dev
```

### Production build

```bash
npm run tauri build
```

---

## Design System

All color tokens, spacing, typography, and border-radius values are defined in
`tailwind.config.js` and map 1:1 to the approved Google Stitch design.

| Token type | Where defined |
|---|---|
| Colors | `tailwind.config.js → theme.extend.colors` |
| Spacing | `tailwind.config.js → theme.extend.spacing` |
| Typography | `tailwind.config.js → theme.extend.fontSize` |
| Glass surface | `.glass-card` in `src/styles/index.css` |
| Icon font | Material Symbols Outlined via Google Fonts CDN |

---

## Adding Real Data (Tauri IPC)

All UI components accept their data as props and fall back to mock data when
none is provided. To wire up real data:

1. Add a Tauri command in Rust (`src-tauri/src/main.rs`)
2. Create a service function in `src/services/` that calls `invoke()`
3. Add a custom hook in `src/hooks/` that calls the service
4. Pass the hook result as props to the relevant page or component

No component files need to change — only the data source at the page level.

---

## Optimized For

- 1440 × 900
- 1920 × 1080  
- 2560 × 1440

Desktop-only. No mobile or tablet breakpoints.
