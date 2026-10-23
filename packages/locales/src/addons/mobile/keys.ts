/**
 * Texts only the mobile add-on uses. Under `k.mobile` once the add-on is
 * on; they go with it when it is removed (docs/addons.md).
 */
export const keys = {
  /** The app's core tabs; the demo add-on adds its own between them. */
  tabs: {
    home: 'mobile.tabs.home',
    profile: 'mobile.tabs.profile',
  },
  home: {
    greeting: 'mobile.home.greeting',
    body: 'mobile.home.body',
    explore: 'mobile.home.explore',
  },
  profile: {
    preferences: 'mobile.profile.preferences',
    darkMode: 'mobile.profile.darkMode',
    darkModeDescription: 'mobile.profile.darkModeDescription',
    language: 'mobile.profile.language',
    chooseLanguage: 'mobile.profile.chooseLanguage',
  },
  // Shown by the app when the installed version is below the minimum.
  update: {
    required: 'mobile.update.required',
    requiredBody: 'mobile.update.requiredBody',
    updateNow: 'mobile.update.updateNow',
  },
} as const;
