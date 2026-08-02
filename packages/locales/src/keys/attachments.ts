/**
 * Attachments translation keys
 */
export const attachments = {
  title: 'attachments.title',
  add: 'attachments.add',
  uploading: 'attachments.uploading',
  empty: 'attachments.empty',
  deleteConfirm: 'attachments.deleteConfirm',
  download: 'attachments.download',

  errors: {
    unknownSubject: 'attachments.errors.unknownSubject',
    subjectNotFound: 'attachments.errors.subjectNotFound',
    notFound: 'attachments.errors.notFound',
    tooLarge: 'attachments.errors.tooLarge',
    kindNotAllowed: 'attachments.errors.kindNotAllowed',
    notUploaded: 'attachments.errors.notUploaded',
    sizeMismatch: 'attachments.errors.sizeMismatch',
    uploadFailed: 'attachments.errors.uploadFailed',
    // The presigned PUT goes straight from the browser to the storage
    // endpoint — when THAT fails at the network level, the usual cause is
    // the bucket's CORS origins not covering this app's origin
    // (STORAGE_CORS_ALLOWED_ORIGINS). Name it, or it costs an afternoon.
    corsBlocked: 'attachments.errors.corsBlocked',
  },
} as const;
