# Mobile Component Showcase — coverage & gap analysis

Compares, for every component in the mobile **Showcase** (Profile → Developer → Component showcase):

- **RNR shows** — what the official [React Native Reusables showcase](https://github.com/founded-labs/react-native-reusables) / shadcn docs typically demonstrate for that component (states, variants, common patterns).
- **We show** — what our demo currently renders (`apps/mobile/src/features/showcase/registry.tsx`).
- **Status** — ✅ solid · ⚠️ thin (works, but shows less than RNR) · ❌ broken/missing.
- **Suggested additions** — what to add to reach parity.

> We have **all 32** RNR NativeWind components installed (0 missing). The showcase demos **31** of them — `native-only-animated-view` is an internal animation helper and isn't a user-facing component (RNR's showcase doesn't list it either).

> ⚠️ The "RNR shows" column is my best description of the canonical demo — **verify against the live RNR showcase** and correct anything that's off. That's the point of this doc.

| # | Component | RNR shows (canonical) | We show | Status | Suggested additions |
|---|-----------|------------------------|---------|--------|---------------------|
| 1 | **Accordion** | Single-open, collapsible, 3 FAQ items | Single-open, 2 items ("Is it accessible?", "Is it themed?") | ✅ | Add a `type="multiple"` example |
| 2 | **Alert** | Default + destructive, each with icon/title/description | Info ("Heads up!") + destructive ("Error"), both with icons | ✅ | — |
| 3 | **Alert Dialog** | Trigger → title/description + Cancel/Action | Trigger → "Are you absolutely sure?" + Cancel/Continue | ✅ | — |
| 4 | **Aspect Ratio** | 16:9 image inside ratio box | 16:9 muted placeholder box | ⚠️ | Use a real `Image` to show it constrains media |
| 5 | **Avatar** | Image with fallback | Image (pravatar) + fallback, and fallback-only | ✅ | — |
| 6 | **Badge** | default / secondary / destructive / outline | Same 4 variants | ✅ | — |
| 7 | **Button** | All variants + sizes, **icon buttons, disabled, loading** | Variants (6) + sizes (sm/lg) | ⚠️ | Add icon button (`size="icon"`), disabled, with-leading-icon |
| 8 | **Card** | Header/Title/Description/Content/Footer, form inside | Header/content/footer with Cancel + Deploy | ✅ | — |
| 9 | **Checkbox** | Checked + with-label + disabled | 2 checkboxes with labels | ⚠️ | Add a disabled example |
| 10 | **Collapsible** | Trigger toggles hidden content | Trigger toggles 2 items | ✅ | — |
| 11 | **Context Menu** | Long-press → items, separators, sub-menu, checkbox items | Long-press area → Back/Reload/Save | ⚠️ | Add sub-menu + checkbox/radio items |
| 12 | **Dialog** | Trigger → form (inputs) + footer | Trigger → Edit profile (name input) + Save | ✅ | — |
| 13 | **Dropdown Menu** | Label, items, separator, **sub-menu, checkbox/radio items, shortcuts** | Label + Profile/Billing/Settings | ⚠️ | Add sub-menu, checkbox/radio items, shortcuts |
| 14 | **Hover Card** | Trigger → rich card (avatar + text) | Link trigger → name + description | ⚠️ | Add an avatar/row layout to match RNR |
| 15 | **Icon** | Lucide icon rendered with size/color via className | 4 colored icons (star/heart/bell/check) | ✅ | — |
| 16 | **Input** | Default, with label, disabled, **with icon** | Label + email input | ⚠️ | Add disabled + leading-icon variants |
| 17 | **Label** | Label paired with a control | Label + input | ✅ | — |
| 18 | **Menubar** | File/Edit/View menus with items/shortcuts/sub-menus | File + Edit menus (New/Open, Undo/Redo) | ⚠️ | Add shortcuts + a sub-menu |
| 19 | **Popover** | Trigger → content (form/settings) | Trigger → "Dimensions" text | ⚠️ | Add inputs inside to match RNR's form popover |
| 20 | **Progress** | Determinate bar (often animated) | Static 66% bar | ⚠️ | Add an animated/indeterminate example |
| 21 | **Radio Group** | Grouped options with labels | 3 options (default/comfortable/compact) | ✅ | — |
| 22 | **Select** | Trigger → grouped items, labels, scroll | Trigger → Apple/Banana/Orange | ⚠️ | Add `SelectGroup` + `SelectLabel` |
| 23 | **Separator** | Horizontal + vertical | Horizontal + vertical (Blog/Docs/Source) | ✅ | — |
| 24 | **Skeleton** | Avatar + text-line placeholders | Avatar + 2 lines | ✅ | — |
| 25 | **Switch** | Toggle with label, disabled | Airplane mode toggle | ⚠️ | Add a disabled example |
| 26 | **Tabs** | Tab list + content per tab (often forms) | Account / Password tabs | ✅ | — |
| 27 | **Text** | Typographic variants (h1–h4, p, blockquote, code, lead, large, small, muted) | h3 / large / p / muted / code | ⚠️ | Add h1/h2/h4, blockquote, small, lead |
| 28 | **Textarea** | Default, with label, disabled | Label + textarea | ✅ | — |
| 29 | **Toggle** | Single toggle (icon), variants/sizes | Bold icon toggle | ⚠️ | Add outline variant + sizes |
| 30 | **Toggle Group** | Single & multiple selection, icons | Multiple (Bold/Italic/Underline) | ⚠️ | Add a `type="single"` example |
| 31 | **Tooltip** | Trigger → tooltip (press on native) | Trigger → "Add to library" | ✅ | — |

## Net-new components (built on top of the RNR core)

Beyond the base RNR set, the showcase now ships these (all in `src/components/ui/`):

- **Feedback / overlays:** Spinner (+ Button `loading`), Toast (`toast.tsx`, themed `sonner-native`), Bottom Sheet (`sheet.tsx`, gesture-driven), Command Palette (`command.tsx`).
- **Inputs:** Date Picker (themed/range/native), Time Picker (single/range), OTP/PIN, Combobox, Slider, Rating, Number Input, Filter Chips.
- **Data display:** List/ListItem (+ SwipeableRow, RowMenu), DataList, DataTable, Record List, Empty State, Timeline, Stat Tile.
- **Dataviz (dep-free):** Progress Ring + Sparkline (`react-native-svg`), Bar Chart (Views).
- **Misc:** Carousel, Stepper, FAB.

Deliberately skipped (web patterns, low mobile value): Pagination · Breadcrumb · Navigation Menu.

## Charts & data visualization

**Default: no charting dependency.** Simple visuals are built from `react-native-svg`
(already installed for icons) or plain Views, so they add **zero native weight** and
stay theme-token styled:

- `bar-chart.tsx` — single-series bars (Views + `bg-primary`).
- `sparkline.tsx` — inline trend line (SVG).
- `progress-ring.tsx` — circular progress (SVG).

For **richer chart types** (line/area/pie, multi-series, tooltips), add a library —
but choose deliberately, because a native module is **compiled into every build's
`.apk`/`.ipa` whether or not any screen imports it** (autolinking links installed
native deps; JS tree-shaking never removes native code):

| Option | Deps to add | Native rebuild? | Binary cost | When |
|--------|-------------|-----------------|-------------|------|
| **`react-native-gifted-charts`** | `react-native-gifted-charts` (SVG-only; rides existing `react-native-svg`) | No | ~none (no new native module) | **Preferred** — line/area/pie/etc. without native bloat. |
| **`victory-native` (XL)** | `victory-native` (already in the `mobile` catalog) + **`@shopify/react-native-skia`** | **Yes** (`pnpm android` / `pnpm ios`) | **+~4–7 MB per ABI**, even if unused | Only when you need Skia-grade performance / interactivity / thousands of points. |

**To add `victory-native`** (opt-in per project):

1. Add `@shopify/react-native-skia` to the `mobile:` catalog in `pnpm-workspace.yaml`
   (pin the Expo-SDK-compatible version), reference both as `catalog:mobile` in
   `apps/mobile/package.json`, then `pnpm install`.
2. Rebuild the dev client once per platform (`pnpm android` / `pnpm ios`) — Skia is a
   native module and won't hot-reload in.
3. Works on **iOS + Android + web** (Skia is cross-platform).

Recommendation: keep the dep-free charts as the baseline; reach for **gifted-charts**
first, and only escalate to **victory-native + Skia** if a screen genuinely needs it.

**Suggested build order:** Toast → Bottom Sheet → OTP input → Slider.

> Housekeeping: `dialog.tsx` is an **orphan** file — removed from the showcase when
> **Modal** replaced it. Safe to delete when convenient.

## Components installed but not in the showcase

| Component | Why not shown | Action |
|-----------|---------------|--------|
| `native-only-animated-view` | Internal animation wrapper, not a user-facing UI component (RNR showcase omits it too) | Leave out (or add a tiny "fade/slide" demo if desired) |

## Notes & known caveats

- **Overlays** (Alert Dialog, Dialog, Dropdown Menu, Context Menu, Menubar, Popover, Hover Card, Tooltip, Select) render through the `<PortalHost />` mounted in `app/_layout.tsx`. If any overlay demo shows the **"This demo failed to render"** card, it's an isolated API mismatch in that one demo — note the component here and it can be fixed without touching the others.
- **Dark theme**: the RNR showcase is dark; ours follows the app theme (toggle via Profile → Dark mode). Worth a pass to confirm each demo reads well in dark.
- **API quirks handled while writing demos** (for reference): `Menubar` needs controlled `value`/`onValueChange` + each `MenubarMenu` a `value`; `Alert` takes an `icon` prop; `Select`'s `SelectContent` takes `insets` from `useSafeAreaInsets`; `Avatar` needs `alt`.

## How to use this doc

1. Open the live RNR showcase (or shadcn docs) next to our app's showcase.
2. For each row, correct the **RNR shows** column to what you actually see.
3. Mark rows where **we should** add/adjust, and I'll update `registry.tsx` accordingly.
