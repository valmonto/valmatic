import type {
  DynamicModule,
  ForwardReference,
  InjectionToken,
  OptionalFactoryDependency,
  Type,
} from '@nestjs/common';

export type StorageProvider = 's3';

export interface StorageModuleOptions {
  provider?: StorageProvider;
  endpoint?: string;
  region?: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  forcePathStyle?: boolean;
  publicBaseUrl?: string;
  corsAllowedOrigins?: string[];
  /**
   * Capability flags for S3-compatibles with narrower APIs (e.g. Cloudflare
   * R2 tokens usually cannot CreateBucket or PutBucketCors — the bucket is
   * provisioned in their dashboard). false → the operation is a no-op
   * instead of a crash. Default true (rustfs/MinIO/dev).
   */
  manageBucket?: boolean;
  manageCors?: boolean;
}

export interface StorageModuleAsyncOptions {
  imports?: (DynamicModule | Type | ForwardReference | Promise<DynamicModule>)[];
  inject?: (InjectionToken | OptionalFactoryDependency)[];
  useFactory: (...args: unknown[]) => StorageModuleOptions | Promise<StorageModuleOptions>;
}

export interface StorageObjectInput {
  bucket?: string;
  key: string;
}

export interface CreateSignedUploadUrlInput extends StorageObjectInput {
  contentType?: string;
  expiresInSeconds?: number;
}

export interface CreateSignedReadUrlInput extends StorageObjectInput {
  expiresInSeconds?: number;
  /** Sets Content-Disposition on the response so downloads get a real name. */
  filename?: string;
  responseContentType?: string;
}

export interface HeadObjectResult {
  contentLength: number;
  contentType?: string;
}

export interface DeleteDirectoryInput {
  bucket?: string;
  prefix: string;
}

export interface SignedStorageUrl {
  bucket: string;
  key: string;
  url: string;
}

/**
 * The storage contract, named. StorageService (S3-family: AWS, R2, MinIO,
 * rustfs, OVH — same client, different config) is the only implementation
 * today; a non-S3 protocol (e.g. Azure Blob native) implements this and
 * slots in behind a provider option with consumers untouched. The
 * behavioral half of the contract is scripts/storage-conformance.mjs —
 * any implementation must pass it against a real endpoint.
 */
export interface StorageDriver {
  bucketExists(bucket?: string): Promise<boolean>;
  createBucket(bucket?: string): Promise<void>;
  ensureBucket(bucket?: string): Promise<void>;
  configureBucketCors(bucket?: string): Promise<void>;
  createSignedUploadUrl(input: CreateSignedUploadUrlInput): Promise<SignedStorageUrl>;
  createSignedReadUrl(input: CreateSignedReadUrlInput): Promise<SignedStorageUrl>;
  headObject(input: StorageObjectInput): Promise<HeadObjectResult | null>;
  deleteFile(input: StorageObjectInput): Promise<void>;
  deleteDirectory(input: DeleteDirectoryInput): Promise<void>;
}
