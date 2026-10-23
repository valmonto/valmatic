/**
 * Authentication-related translation keys
 */
export const auth = {
  // Labels
  email: 'auth.email',
  password: 'auth.password',
  currentPassword: 'auth.currentPassword',
  newPassword: 'auth.newPassword',
  confirmPassword: 'auth.confirmPassword',

  // Forgotten password
  forgotPassword: 'auth.forgotPassword',
  forgotPasswordTitle: 'auth.forgotPasswordTitle',
  forgotPasswordDescription: 'auth.forgotPasswordDescription',
  sendResetLink: 'auth.sendResetLink',
  sendingResetLink: 'auth.sendingResetLink',
  resetLinkSent: 'auth.resetLinkSent',
  chooseNewPassword: 'auth.chooseNewPassword',
  settingNewPassword: 'auth.settingNewPassword',
  passwordChanged: 'auth.passwordChanged',
  backToSignIn: 'auth.backToSignIn',

  // Confirming the email address
  confirmEmailTitle: 'auth.confirmEmailTitle',
  confirmEmailBody: 'auth.confirmEmailBody',
  resendConfirmation: 'auth.resendConfirmation',
  confirmationSent: 'auth.confirmationSent',
  confirmationNotSent: 'auth.confirmationNotSent',
  changeEmail: 'auth.changeEmail',
  emailConfirmed: 'auth.emailConfirmed',

  // Actions
  signIn: 'auth.signIn',
  signUp: 'auth.signUp',
  logIn: 'auth.logIn',
  logOut: 'auth.logOut',
  signingIn: 'auth.signingIn',
  loggingOut: 'auth.loggingOut',
  changePassword: 'auth.changePassword',
  changingPassword: 'auth.changingPassword',

  // Messages
  signInToAccount: 'auth.signInToAccount',
  dontHaveAccount: 'auth.dontHaveAccount',
  alreadyHaveAccount: 'auth.alreadyHaveAccount',
  createOne: 'auth.createOne',
  createAccount: 'auth.createAccount',
  creatingAccount: 'auth.creatingAccount',
  getStartedWithWorkspace: 'auth.getStartedWithWorkspace',
  capsLockWarning: 'auth.capsLockWarning',
  welcomeBack: 'auth.welcomeBack',
  welcomeBackName: 'auth.welcomeBackName',
  notLoggedIn: 'auth.notLoggedIn',
  enterPassword: 'auth.enterPassword',

  // Password requirements
  minCharacters: 'auth.minCharacters',
  passwordRequirements: 'auth.passwordRequirements',
  atLeast8Chars: 'auth.atLeast8Chars',
  oneUppercase: 'auth.oneUppercase',
  oneLowercase: 'auth.oneLowercase',
  oneNumber: 'auth.oneNumber',
  oneSpecialChar: 'auth.oneSpecialChar',
  strength: 'auth.strength',
  weak: 'auth.weak',
  medium: 'auth.medium',
  strong: 'auth.strong',

  // Logout all devices
  logOutAllDevices: 'auth.logOutAllDevices',
  logOutAllDevicesConfirm: 'auth.logOutAllDevicesConfirm',
  logOutAllDevicesDescription: 'auth.logOutAllDevicesDescription',
  logOutAllDevicesWarning: 'auth.logOutAllDevicesWarning',

  // Errors
  errors: {
    invalidCredentials: 'auth.errors.invalidCredentials',
    invalidEmailOrPassword: 'auth.errors.invalidEmailOrPassword',
    loginFailed: 'auth.errors.loginFailed',
    tooManyAttempts: 'auth.errors.tooManyAttempts',
    resetLinkInvalid: 'auth.errors.resetLinkInvalid',
    verifyLinkInvalid: 'auth.errors.verifyLinkInvalid',
    emailAlreadyVerified: 'auth.errors.emailAlreadyVerified',
    unableToChangeEmail: 'auth.errors.unableToChangeEmail',
    accountDisabled: 'auth.errors.accountDisabled',
    tooManyRequests: 'auth.errors.tooManyRequests',
    registrationDisabled: 'auth.errors.registrationDisabled',
    unableToCreateAccount: 'auth.errors.unableToCreateAccount',
    userNotFound: 'auth.errors.userNotFound',
    noOrgAccess: 'auth.errors.noOrgAccess',
    currentPasswordIncorrect: 'auth.errors.currentPasswordIncorrect',
    currentPasswordRequired: 'auth.errors.currentPasswordRequired',
    newPasswordMustDiffer: 'auth.errors.newPasswordMustDiffer',
    passwordsDoNotMatch: 'auth.errors.passwordsDoNotMatch',
    failedToChangePassword: 'auth.errors.failedToChangePassword',
    failedToLogOut: 'auth.errors.failedToLogOut',
    failedToLogOutAll: 'auth.errors.failedToLogOutAll',
    unauthorized: 'auth.errors.unauthorized',
    // Token/session errors
    invalidRefreshToken: 'auth.errors.invalidRefreshToken',
    invalidToken: 'auth.errors.invalidToken',
    tokenRevoked: 'auth.errors.tokenRevoked',
    sessionExpired: 'auth.errors.sessionExpired',
    sessionExpiredPleaseLogin: 'auth.errors.sessionExpiredPleaseLogin',
    sessionInvalidated: 'auth.errors.sessionInvalidated',
    orgAccessRevoked: 'auth.errors.orgAccessRevoked',
    // Role/permission errors
    roleAuthorizationRequired: 'auth.errors.roleAuthorizationRequired',
    noRoleAssigned: 'auth.errors.noRoleAssigned',
    insufficientPermissions: 'auth.errors.insufficientPermissions',
  },

  // Settings page
  settings: {
    title: 'auth.settings.title',
    description: 'auth.settings.description',
    updatePasswordDescription: 'auth.settings.updatePasswordDescription',
    security: 'auth.settings.security',
    account: 'auth.settings.account',
    downloadData: 'auth.settings.downloadData',
    downloadDataDescription: 'auth.settings.downloadDataDescription',
    preparingDownload: 'auth.settings.preparingDownload',
    deleteAccount: 'auth.settings.deleteAccount',
    deleteAccountDescription: 'auth.settings.deleteAccountDescription',
    deleteAccountConfirm: 'auth.settings.deleteAccountConfirm',
    deleteAccountWarning: 'auth.settings.deleteAccountWarning',
    deleteAccountPassword: 'auth.settings.deleteAccountPassword',
    deletingAccount: 'auth.settings.deletingAccount',
  },
} as const;
