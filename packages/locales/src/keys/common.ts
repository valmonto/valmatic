/**
 * Common/shared translation keys
 */
export const common = {
  // Actions
  actions: {
    create: 'common.actions.create',
    edit: 'common.actions.edit',
    delete: 'common.actions.delete',
    save: 'common.actions.save',
    cancel: 'common.actions.cancel',
    back: 'common.actions.back',
    open: 'common.actions.open',
    view: 'common.actions.view',
    goHome: 'common.actions.goHome',
    tryAgain: 'common.actions.tryAgain',
  },

  // Status
  status: {
    created: 'common.status.created',
    action: 'common.status.action',
  },

  // Navigation
  nav: {
    dashboard: 'common.nav.dashboard',
    analytics: 'common.nav.analytics',
    settings: 'common.nav.settings',
    overview: 'common.nav.overview',
    management: 'common.nav.management',
    developer: 'common.nav.developer',
    errorTest: 'common.nav.errorTest',
  },

  // Dashboard
  dashboard: {
    title: 'common.dashboard.title',
    subtitle: 'common.dashboard.subtitle',
    totalUsers: 'common.dashboard.totalUsers',
    revenue: 'common.dashboard.revenue',
    activeSessions: 'common.dashboard.activeSessions',
    growth: 'common.dashboard.growth',
    fromLastMonth: 'common.dashboard.fromLastMonth',
    weeklyActivity: 'common.dashboard.weeklyActivity',
    weeklyActivityDesc: 'common.dashboard.weeklyActivityDesc',
    recentActivity: 'common.dashboard.recentActivity',
    recentActivityDesc: 'common.dashboard.recentActivityDesc',
    allSystemsOperational: 'common.dashboard.allSystemsOperational',
  },

  // Time
  time: {
    minuteAgo: 'common.time.minuteAgo',
    minutesAgo: 'common.time.minutesAgo',
    hourAgo: 'common.time.hourAgo',
    hoursAgo: 'common.time.hoursAgo',
  },

  // Messages
  comingSoon: 'common.comingSoon',
  pageNotFound: 'common.pageNotFound',
  somethingWentWrong: 'common.somethingWentWrong',
  unexpectedError: 'common.unexpectedError',

  // Error test page
  errorTest: {
    title: 'common.errorTest.title',
    description: 'common.errorTest.description',
    triggerError: 'common.errorTest.triggerError',
    triggerErrorDescription: 'common.errorTest.triggerErrorDescription',
    crashPage: 'common.errorTest.crashPage',
  },

  // Errors
  errors: {
    failedToCreateUser: 'common.errors.failedToCreateUser',
    failedToCreateOrg: 'common.errors.failedToCreateOrg',
    failedToCreateOrgMembership: 'common.errors.failedToCreateOrgMembership',
    failedToRetrieveOrg: 'common.errors.failedToRetrieveOrg',
  },

  // Activity examples
  activity: {
    newUserRegistered: 'common.activity.newUserRegistered',
    reportGenerated: 'common.activity.reportGenerated',
    settingsUpdated: 'common.activity.settingsUpdated',
    securityCheckPassed: 'common.activity.securityCheckPassed',
    emailNotificationsEnabled: 'common.activity.emailNotificationsEnabled',
    monthlyAnalyticsExport: 'common.activity.monthlyAnalyticsExport',
  },

  // Analytics
  analytics: {
    description: 'common.analytics.description',
  },

  // Settings
  settings: {
    description: 'common.settings.description',
  },
} as const;
