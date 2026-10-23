/**
 * Texts only the demo add-on uses, under `k.demo`. A new project never keeps
 * the demo (docs/addons.md).
 */
const jobs = {
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
};

export const keys = {
  /** The example-jobs page. */
  jobs,
  /** The dashboard's link to the phone-layout demo. */
  phone: 'demo.phone',
  /** The mobile app's demo tabs and pages. */
  app: {
    tasks: 'demo.app.tasks',
    inbox: 'demo.app.inbox',
    showcase: 'demo.app.showcase',
    showcaseBody: 'demo.app.showcaseBody',
    blocks: 'demo.app.blocks',
    blocksBody: 'demo.app.blocksBody',
  },
} as const;
