/**
 * Texts only the mobile add-on uses. Under `k.mobile` once the add-on is
 * on; they go with it when it is removed (docs/addons.md).
 */
export const keys = {
  /** The dashboard's link to the phone-layout demo. */
  nav: 'mobile.nav',
  // Shown by the app when the installed version is below the minimum.
  update: {
    required: 'mobile.update.required',
    requiredBody: 'mobile.update.requiredBody',
    updateNow: 'mobile.update.updateNow',
  },
} as const;
