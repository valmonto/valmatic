/**
 * Background jobs translation keys
 */
export const jobs = {
  // Labels
  jobs: 'jobs.jobs',
  createJob: 'jobs.createJob',
  queueJob: 'jobs.queueJob',
  queueing: 'jobs.queueing',
  priority: 'jobs.priority',
  delay: 'jobs.delay',
  dataJson: 'jobs.dataJson',

  // Actions
  generateReport: 'jobs.generateReport',
  sendEmail: 'jobs.sendEmail',
  syncData: 'jobs.syncData',

  // Descriptions
  description: 'jobs.description',
  queueDescription: 'jobs.queueDescription',
  aboutJobs: 'jobs.aboutJobs',
  aboutJobsDescription: 'jobs.aboutJobsDescription',
  generateReportDesc: 'jobs.generateReportDesc',
  sendEmailDesc: 'jobs.sendEmailDesc',
  syncDataDesc: 'jobs.syncDataDesc',
  dataJsonDesc: 'jobs.dataJsonDesc',

  // Messages
  queuedSuccess: 'jobs.queuedSuccess',

  // Errors
  errors: {
    mustBeLoggedIn: 'jobs.errors.mustBeLoggedIn',
  },
} as const;
