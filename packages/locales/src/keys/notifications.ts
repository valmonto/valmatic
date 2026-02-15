/**
 * Notifications translation keys
 */
export const notifications = {
  // Labels
  notifications: 'notifications.notifications',
  new: 'notifications.new',

  // Filters
  all: 'notifications.all',
  unread: 'notifications.unread',
  read: 'notifications.read',

  // Actions
  markAllRead: 'notifications.markAllRead',
  clearAll: 'notifications.clearAll',
  viewAll: 'notifications.viewAll',
  viewDetails: 'notifications.viewDetails',
  dismiss: 'notifications.dismiss',
  undo: 'notifications.undo',

  // Messages
  deleted: 'notifications.deleted',
  clearedCount: 'notifications.clearedCount',
  unreadCount: 'notifications.unreadCount',
  allCaughtUp: 'notifications.allCaughtUp',

  // Empty states
  empty: {
    none: 'notifications.empty.none',
    noUnread: 'notifications.empty.noUnread',
    noRead: 'notifications.empty.noRead',
    description: 'notifications.empty.description',
    allCaughtUpDesc: 'notifications.empty.allCaughtUpDesc',
    noReadYet: 'notifications.empty.noReadYet',
  },

  // Time
  time: {
    justNow: 'notifications.time.justNow',
    minutesAgo: 'notifications.time.minutesAgo',
    hoursAgo: 'notifications.time.hoursAgo',
    daysAgo: 'notifications.time.daysAgo',
  },

  // Errors
  errors: {
    notFound: 'notifications.errors.notFound',
  },
} as const;
