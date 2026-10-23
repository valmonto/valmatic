import * as React from 'react';
import { FileText } from 'lucide-react';
import type { AttachmentWithUrls } from '@pkg/contracts';

import { AttachmentGalleryDialog } from '@/shared/attachments';
import { Button } from '@/components/ui/button';
import { Row, Section } from '../components/section';

/** Inline SVG swatch — the showcase needs no storage, network, or subject. */
const svgUrl = (label: string, from: string, to: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>` +
      `</linearGradient></defs>` +
      `<rect width="640" height="400" fill="url(#g)"/>` +
      `<text x="50%" y="52%" font-family="monospace" font-size="28" fill="white" text-anchor="middle">${label}</text>` +
      `</svg>`,
  )}`;

const stubAttachment = (
  id: string,
  overrides: Partial<AttachmentWithUrls['attachment']>,
): AttachmentWithUrls['attachment'] => ({
  id,
  orgId: '00000000-0000-7000-8000-000000000000',
  subjectType: 'demo',
  subjectId: '00000000-0000-7000-8000-000000000001',
  kind: 'image',
  status: 'uploaded',
  fileName: null,
  mimeType: 'image/svg+xml',
  sizeBytes: 24_576,
  waveform: null,
  hasThumbnail: false,
  uploadedBy: '00000000-0000-7000-8000-000000000002',
  expiresAt: null,
  createdAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Local stand-ins for what the API would return: in a live app every readUrl
 * is a presigned GET minted per request (docs/storage.md); here they are data
 * URIs so the template renders the gallery without storage or a subject.
 */
const STUB_ITEMS: AttachmentWithUrls[] = [
  {
    attachment: stubAttachment('00000000-0000-7000-8000-00000000000a', {
      fileName: 'screenshot-login.svg',
    }),
    readUrl: svgUrl('screenshot-login', '#6366f1', '#0ea5e9'),
    thumbnailReadUrl: null,
  },
  {
    attachment: stubAttachment('00000000-0000-7000-8000-00000000000b', {
      fileName: 'screenshot-dashboard.svg',
    }),
    readUrl: svgUrl('screenshot-dashboard', '#059669', '#84cc16'),
    thumbnailReadUrl: null,
  },
  {
    attachment: stubAttachment('00000000-0000-7000-8000-00000000000c', {
      kind: 'file',
      fileName: 'build-log.txt',
      mimeType: 'text/plain',
      sizeBytes: 4_096,
    }),
    readUrl: `data:text/plain;utf8,${encodeURIComponent('demo build log — all green\n')}`,
    thumbnailReadUrl: null,
  },
];

/**
 * The attachments UI kit (`@/shared/attachments`) demoed on stub data. The
 * full `<AttachmentsSection subjectType subjectId />` needs a live subject
 * with a registered resolver, so the showcase drives the gallery directly.
 */
export function AttachmentsShowcaseSection() {
  const [index, setIndex] = React.useState<number | null>(null);

  return (
    <Section
      title="Attachments"
      description="Presigned-upload gallery from shared/attachments — stub items, no storage needed."
    >
      <Row label="Gallery (click a tile)">
        <div className="grid w-full grid-cols-3 gap-2">
          {STUB_ITEMS.map((item, itemIndex) => (
            <button
              key={item.attachment.id}
              type="button"
              onClick={() => setIndex(itemIndex)}
              className="group overflow-hidden rounded-lg border text-left transition-colors hover:bg-muted/50"
            >
              {item.attachment.kind === 'image' ? (
                <img
                  src={item.readUrl}
                  alt={item.attachment.fileName ?? 'attachment'}
                  className="h-24 w-full object-cover"
                />
              ) : (
                <div className="flex h-24 items-center justify-center text-muted-foreground">
                  <FileText className="size-6" />
                </div>
              )}
              <p className="truncate px-2 py-1 text-[11px] text-muted-foreground">
                {item.attachment.fileName}
              </p>
            </button>
          ))}
        </div>
      </Row>
      <Row label="Or open it directly">
        <Button variant="outline" size="sm" onClick={() => setIndex(0)}>
          Open gallery
        </Button>
      </Row>

      <AttachmentGalleryDialog
        items={STUB_ITEMS}
        index={index}
        onClose={() => setIndex(null)}
        onSelect={setIndex}
      />
    </Section>
  );
}
