# Force-update & in-app review

## Force update (version gating)

`ForceUpdateGate` (mounted at the root in `_layout.tsx`) blocks the app with an
**"Update required"** screen when the installed version is **below a minimum**, and
sends the user to the store. It overlays the app (the navigator stays mounted), so
routing state is preserved underneath.

**Where the minimum comes from** (`shared/update/version.ts`):

- Default: app config `extra.minAppVersion` in `app.json`.
- Recommended for a _true_ force-update: fetch the minimum from your API at runtime
  and pass it in — so you can gate an old client **without shipping a new build**:
  ```tsx
  <ForceUpdateGate minVersion={config?.minAppVersion} appStoreId="123456789">
    …
  </ForceUpdateGate>
  ```

**To enable it via config** (gates anyone below `1.2.0`):

```json
// app.json → expo.extra
"extra": { "minAppVersion": "1.2.0" }
```

Left unset by default, so the gate is inactive until you opt in.

**Store deep-link** — Android uses the `android.package` automatically; for iOS, pass
your numeric **App Store id** (`appStoreId`, assigned after the first App Store submission)
so it opens the listing directly.

## In-app review

`requestReview()` (`shared/lib/review.ts`) shows the native rating prompt via
`expo-store-review`.

```ts
import { requestReview } from '@/shared/lib/review';
// call at a natural, positive moment — e.g. after completing a task:
await requestReview();
```

Rules of thumb:

- Call it **after a win** (task done, purchase succeeded) — never on launch, never after an error.
- The OS **throttles** how often the prompt actually shows (a few times a year max), so
  calling `requestReview()` is a _request_, not a guarantee — don't gate anything on it.
- It's best-effort and silently no-ops where unsupported (e.g. simulators, some regions).

> `expo-store-review` is a native module — it was added, so **rebuild** the dev client
> once (`pnpm android` / `pnpm ios`) to use `requestReview()`.
