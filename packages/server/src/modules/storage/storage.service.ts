import { Inject, Injectable } from '@nestjs/common';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
  type BucketLocationConstraint,
  type CreateBucketCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { STORAGE_OPTIONS } from './storage.tokens.js';
import type {
  StorageDriver,
  CreateSignedReadUrlInput,
  CreateSignedUploadUrlInput,
  DeleteDirectoryInput,
  HeadObjectResult,
  SignedStorageUrl,
  StorageModuleOptions,
  StorageObjectInput,
} from './storage.types.js';

const DEFAULT_REGION = 'us-east-1';
const DEFAULT_SIGNED_URL_EXPIRATION_SECONDS = 900;
const MAX_DELETE_OBJECTS = 1000;

@Injectable()
export class StorageService implements StorageDriver {
  private readonly client: S3Client;
  private readonly defaultBucket: string;
  private readonly region: string;

  constructor(@Inject(STORAGE_OPTIONS) private readonly options: StorageModuleOptions) {
    this.region = options.region ?? DEFAULT_REGION;
    this.defaultBucket = options.bucket;
    this.client = new S3Client({
      region: this.region,
      endpoint: options.endpoint,
      forcePathStyle: options.forcePathStyle ?? Boolean(options.endpoint),
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
      // Fail fast when the endpoint is unreachable (e.g. stale LAN IP) —
      // otherwise HeadBucket hangs the whole request pipeline.
      maxAttempts: 2,
      requestHandler: { connectionTimeout: 3000, requestTimeout: 10000 },
      // The SDK's default CRC32 checksums break several S3-compatibles
      // (R2/MinIO/GCS interop). WHEN_REQUIRED is a no-op on AWS and the
      // documented compatibility setting everywhere else.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  async bucketExists(bucket?: string): Promise<boolean> {
    const bucketName = this.resolveBucket(bucket);

    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucketName }));
      return true;
    } catch (error) {
      if (this.isNotFoundError(error)) return false;
      throw error;
    }
  }

  async createBucket(bucket?: string): Promise<void> {
    const bucketName = this.resolveBucket(bucket);
    const input: CreateBucketCommandInput = { Bucket: bucketName };

    if (this.region !== DEFAULT_REGION) {
      input.CreateBucketConfiguration = {
        LocationConstraint: this.region as BucketLocationConstraint,
      };
    }

    await this.client.send(new CreateBucketCommand(input));
  }

  async ensureBucket(bucket?: string): Promise<void> {
    // Providers where the token cannot manage buckets (R2): pre-provisioned,
    // nothing to ensure.
    if (this.options.manageBucket === false) return;
    const bucketName = this.resolveBucket(bucket);
    const exists = await this.bucketExists(bucketName);

    if (!exists) {
      await this.createBucket(bucketName);
    }
  }

  async configureBucketCors(bucket?: string): Promise<void> {
    if (this.options.manageCors === false) return;
    const allowedOrigins = this.options.corsAllowedOrigins?.filter(Boolean) ?? [];
    if (allowedOrigins.length === 0) return;

    await this.client.send(
      new PutBucketCorsCommand({
        Bucket: this.resolveBucket(bucket),
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: allowedOrigins,
              AllowedMethods: ['GET', 'PUT', 'HEAD', 'DELETE'],
              AllowedHeaders: ['*'],
              ExposeHeaders: ['ETag'],
              MaxAgeSeconds: 3000,
            },
          ],
        },
      }),
    );
  }

  async createSignedUploadUrl(input: CreateSignedUploadUrlInput): Promise<SignedStorageUrl> {
    const bucket = this.resolveBucket(input.bucket);
    const key = this.resolveKey(input.key);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: input.contentType,
    });

    const url = await getSignedUrl(this.client, command, {
      expiresIn: input.expiresInSeconds ?? DEFAULT_SIGNED_URL_EXPIRATION_SECONDS,
    });

    return { bucket, key, url };
  }

  async createSignedReadUrl(input: CreateSignedReadUrlInput): Promise<SignedStorageUrl> {
    const bucket = this.resolveBucket(input.bucket);
    const key = this.resolveKey(input.key);

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      // A real filename on downloads instead of the opaque blob id.
      ...(input.filename
        ? {
            ResponseContentDisposition: `attachment; filename="${input.filename.replaceAll('"', '')}"`,
          }
        : {}),
      ...(input.responseContentType ? { ResponseContentType: input.responseContentType } : {}),
    });

    const url = await getSignedUrl(this.client, command, {
      expiresIn: input.expiresInSeconds ?? DEFAULT_SIGNED_URL_EXPIRATION_SECONDS,
    });

    return { bucket, key, url };
  }

  /**
   * The confirm step's truth source: what actually landed in the store.
   * Returns null when the object does not exist (client never uploaded).
   */
  async headObject(input: StorageObjectInput): Promise<HeadObjectResult | null> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.resolveBucket(input.bucket),
          Key: this.resolveKey(input.key),
        }),
      );
      return { contentLength: result.ContentLength ?? 0, contentType: result.ContentType };
    } catch (error) {
      if (this.isNotFoundError(error)) return null;
      throw error;
    }
  }

  async deleteFile(input: StorageObjectInput): Promise<void> {
    const bucket = this.resolveBucket(input.bucket);
    const key = this.resolveKey(input.key);

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  }

  async deleteDirectory(input: DeleteDirectoryInput): Promise<void> {
    const bucket = this.resolveBucket(input.bucket);
    const prefix = this.resolvePrefix(input.prefix);
    let continuationToken: string | undefined;

    do {
      const listed = await this.client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      const objects = (listed.Contents ?? [])
        .filter((object) => object.Key)
        .map((object) => ({ Key: object.Key }));

      for (let index = 0; index < objects.length; index += MAX_DELETE_OBJECTS) {
        const batch = objects.slice(index, index + MAX_DELETE_OBJECTS);

        if (batch.length > 0) {
          await this.client.send(
            new DeleteObjectsCommand({
              Bucket: bucket,
              Delete: {
                Objects: batch,
                Quiet: true,
              },
            }),
          );
        }
      }

      continuationToken = listed.NextContinuationToken;
    } while (continuationToken);
  }

  private resolveBucket(bucket?: string): string {
    const resolved = bucket ?? this.defaultBucket;

    if (!resolved.trim()) {
      throw new Error('Storage bucket is required');
    }

    return resolved;
  }

  private resolveKey(key: string): string {
    if (!key.trim()) {
      throw new Error('Storage key is required');
    }

    return key;
  }

  private resolvePrefix(prefix: string): string {
    if (!prefix.trim()) {
      throw new Error('Storage prefix is required');
    }

    return prefix;
  }

  private isNotFoundError(error: unknown): boolean {
    const statusCode = this.getErrorStatusCode(error);
    const name = this.getErrorName(error);

    return statusCode === 404 || name === 'NotFound' || name === 'NoSuchBucket';
  }

  private getErrorStatusCode(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null || !('$metadata' in error)) {
      return undefined;
    }

    const metadata = (error as { $metadata?: { httpStatusCode?: number } }).$metadata;

    return metadata?.httpStatusCode;
  }

  private getErrorName(error: unknown): string | undefined {
    if (typeof error !== 'object' || error === null || !('name' in error)) {
      return undefined;
    }

    const name = (error as { name?: unknown }).name;

    return typeof name === 'string' ? name : undefined;
  }
}
