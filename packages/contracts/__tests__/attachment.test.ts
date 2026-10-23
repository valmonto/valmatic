import { describe, expect, it } from 'vitest';
import { attachmentInlineSafe, attachmentMimeAllowed } from '../src/index.js';

describe('attachment types', () => {
  it('shows raster images, video, audio and PDF inline', () => {
    for (const type of ['image/png', 'image/jpeg', 'video/mp4', 'audio/mpeg', 'application/pdf']) {
      expect(attachmentInlineSafe(type), type).toBe(true);
    }
    expect(attachmentInlineSafe('IMAGE/PNG; charset=binary')).toBe(true);
  });

  // Each of these can carry script that runs when the file is opened.
  it('sends anything that can run script as a download', () => {
    for (const type of [
      'image/svg+xml',
      'text/html',
      'application/xhtml+xml',
      'text/xml',
      'application/javascript',
      'application/octet-stream',
    ]) {
      expect(attachmentInlineSafe(type), type).toBe(false);
    }
  });

  it('accepts any declared type for a subject without an allowlist', () => {
    expect(attachmentMimeAllowed('no-policy-subject', 'image/svg+xml')).toBe(true);
  });
});
