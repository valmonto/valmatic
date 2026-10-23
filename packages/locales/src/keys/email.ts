/**
 * Email translation keys — the words of the messages the API sends.
 * `{{minutes}}` is filled in by the sender.
 */
export const email = {
  resetPassword: {
    subject: 'email.resetPassword.subject',
    intro: 'email.resetPassword.intro',
    button: 'email.resetPassword.button',
    expiry: 'email.resetPassword.expiry',
    ignore: 'email.resetPassword.ignore',
  },
} as const;
