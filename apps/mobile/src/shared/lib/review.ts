import * as StoreReview from 'expo-store-review';

/**
 * Ask for a native App Store / Play Store rating at a natural, positive moment
 * (e.g. after a task completes or a purchase succeeds). The OS heavily throttles
 * how often the prompt actually appears, so call it sparingly — never on launch,
 * never after an error. Best-effort: silently no-ops where unsupported.
 */
export async function requestReview(): Promise<void> {
  try {
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
    }
  } catch {
    // review UI is best-effort; ignore failures
  }
}
