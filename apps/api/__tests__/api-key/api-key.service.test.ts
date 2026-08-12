import { NotFoundException } from '@nestjs/common';
import { FakeLogger } from '@pkg/testing';
import type { PinoLogger } from 'nestjs-pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiKeyService } from '@/api-key/api-key.service';
import type { ApiKeyRepository } from '@/api-key/api-key.repository';

const now = new Date('2026-01-01T00:00:00.000Z');

describe('ApiKeyService', () => {
  let service: ApiKeyService;
  let repository: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    repository = {
      insert: vi.fn().mockImplementation((row: object) =>
        Promise.resolve({
          id: '11111111-1111-4111-8111-111111111111',
          lastUsedAt: null,
          revokedAt: null,
          createdAt: now,
          ...row,
        }),
      ),
      listActive: vi.fn().mockResolvedValue([]),
      findActiveByHash: vi.fn().mockResolvedValue(null),
      revoke: vi.fn().mockResolvedValue(true),
      touchLastUsed: vi.fn().mockResolvedValue(undefined),
    };
    service = new ApiKeyService(
      repository as unknown as ApiKeyRepository,
      new FakeLogger().as<PinoLogger>(),
    );
  });

  it('returns the plaintext once and stores only its hash', async () => {
    const created = await service.create('u1', { name: 'ci', scopes: ['orgs:read'] });

    expect(created.key).toMatch(/^sk_/);
    const stored = repository.insert!.mock.calls[0]![0] as { hashedKey: string; prefix: string };
    expect(stored.hashedKey).not.toContain(created.key);
    expect(stored.hashedKey).toMatch(/^[0-9a-f]{64}$/); // sha256 hex, not plaintext
    expect(created.key.startsWith(stored.prefix)).toBe(true);
  });

  it('deduplicates granted scopes', async () => {
    await service.create('u1', { name: 'ci', scopes: ['orgs:read', 'orgs:read'] });

    const stored = repository.insert!.mock.calls[0]![0] as { scopes: string[] };
    expect(stored.scopes).toEqual(['orgs:read']);
  });

  it('verifies a token by hash and returns its scopes', async () => {
    const created = await service.create('u1', { name: 'ci', scopes: ['platform:read'] });
    const stored = repository.insert!.mock.calls[0]![0] as { hashedKey: string };
    repository.findActiveByHash!.mockResolvedValue({
      id: 'k1',
      name: 'ci',
      scopes: ['platform:read'],
      hashedKey: stored.hashedKey,
    });

    const auth = await service.verify(created.key);

    expect(repository.findActiveByHash).toHaveBeenCalledWith(stored.hashedKey);
    expect(auth).toMatchObject({ keyId: 'k1', scopes: ['platform:read'] });
  });

  it('answers null for an unknown or revoked token', async () => {
    await expect(service.verify('sk_nonsense')).resolves.toBeNull();
  });

  it('reports revoking an unknown key as not found', async () => {
    repository.revoke!.mockResolvedValue(false);

    await expect(service.revoke('missing')).rejects.toThrow(NotFoundException);
  });

  // The list is what an admin sees — it must never carry hashes or plaintext.
  it('never exposes the hash in the list view', async () => {
    repository.listActive!.mockResolvedValue([
      {
        id: 'k1',
        name: 'ci',
        prefix: 'sk_abc',
        hashedKey: 'deadbeef',
        scopes: ['orgs:read'],
        lastUsedAt: null,
        revokedAt: null,
        createdAt: now,
      },
    ]);

    const { data } = await service.list();

    expect(JSON.stringify(data)).not.toContain('deadbeef');
  });
});
