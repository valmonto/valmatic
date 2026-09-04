#!/usr/bin/env node
/**
 * Storage conformance check — the executable half of the StorageDriver
 * contract. Run it against any S3-compatible endpoint BEFORE adopting it:
 *
 *   STORAGE_ENDPOINT=https://... STORAGE_ACCESS_KEY_ID=... \
 *   STORAGE_SECRET_ACCESS_KEY=... STORAGE_BUCKET=... \
 *   node scripts/storage-conformance.mjs
 *
 * Exercises exactly what the attachments protocol needs: ensure-bucket,
 * presigned PUT (as a browser would), HEAD (the confirm step), presigned
 * GET (the read path), delete. Pass = the provider works; anything else =
 * the provider is not a drop-in and needs a look at StorageService.
 */
import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const env = (name, fallback) => process.env[name] ?? fallback;
const endpoint = env('STORAGE_ENDPOINT', 'http://localhost:9000');
const bucket = env('STORAGE_BUCKET', 'conformance-check');

const client = new S3Client({
  region: env('STORAGE_REGION', 'us-east-1'),
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env('STORAGE_ACCESS_KEY_ID', 'valmatic'),
    secretAccessKey: env('STORAGE_SECRET_ACCESS_KEY', 'valmatic'),
  },
  maxAttempts: 2,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

const key = `conformance/${Date.now()}.txt`;
const body = `storage-conformance ${new Date().toISOString()}`;
let failed = false;

const step = async (name, fn) => {
  try {
    const detail = await fn();
    console.log(`  ok  ${name}${detail ? ` — ${detail}` : ''}`);
  } catch (error) {
    failed = true;
    console.log(`FAIL  ${name} — ${error.name ?? ''} ${error.message}`);
  }
};

console.log(`Storage conformance against ${endpoint} (bucket: ${bucket})`);

await step('ensure bucket', async () => {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return 'exists';
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    return 'created';
  }
});

await step('presigned PUT uploads (browser path)', async () => {
  const url = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: 'text/plain' }),
    { expiresIn: 300 },
  );
  const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body });
  if (!res.ok) throw new Error(`PUT ${res.status}`);
});

await step('HEAD reports truthful size (confirm path)', async () => {
  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  if (head.ContentLength !== body.length)
    throw new Error(`size ${head.ContentLength} != ${body.length}`);
  return `${head.ContentLength} bytes`;
});

await step('presigned GET serves the bytes (read path)', async () => {
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: 'attachment; filename="check.txt"',
    }),
    { expiresIn: 300 },
  );
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${res.status}`);
  const text = await res.text();
  if (text !== body) throw new Error('body mismatch');
  const cd = res.headers.get('content-disposition') ?? '';
  return cd.includes('check.txt')
    ? 'content-disposition honored'
    : 'WARNING: content-disposition ignored';
});

await step('delete removes (sweep path)', async () => {
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  const gone = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key })).then(
    () => false,
    () => true,
  );
  if (!gone) throw new Error('object still present after delete');
});

console.log(
  failed ? '\nRESULT: FAIL — not a drop-in provider' : '\nRESULT: PASS — provider is a drop-in',
);
process.exit(failed ? 1 : 0);
