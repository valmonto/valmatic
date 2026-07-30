import { NotFoundException } from '@nestjs/common';
import type { ActiveUser } from '@pkg/contracts';
import { FakeLogger } from '@pkg/testing';
import type { PinoLogger } from 'nestjs-pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationService } from '@/notifications/notification.service';
import type { NotificationRepository } from '@/notifications/notification.repository';

const ORG = '11111111-1111-4111-8111-111111111111';
const USER = '22222222-2222-4222-8222-222222222222';
const NOTIF = '33333333-3333-4333-8333-333333333333';
const now = new Date('2026-01-01T00:00:00.000Z');

const member: ActiveUser = { userId: USER, orgId: ORG, orgRole: 'MEMBER', systemRole: 'USER' };

const row = {
  id: NOTIF,
  userId: USER,
  orgId: ORG,
  type: 'info' as const,
  channel: 'in_app' as const,
  title: 'Hello',
  message: null,
  link: null,
  data: null,
  read: false,
  readAt: null,
  createdAt: now,
};

describe('NotificationService', () => {
  let service: NotificationService;
  let repository: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    repository = {
      create: vi.fn().mockResolvedValue(row),
      findForUser: vi.fn().mockResolvedValue({ data: [row], total: 1 }),
      findById: vi.fn().mockResolvedValue(row),
      markAsRead: vi.fn().mockResolvedValue({ ...row, read: true, readAt: now }),
      markAllAsRead: vi.fn().mockResolvedValue(2),
      getUnreadCount: vi.fn().mockResolvedValue(2),
      delete: vi.fn().mockResolvedValue(true),
      deleteAll: vi.fn().mockResolvedValue(3),
    };
    service = new NotificationService(
      repository as unknown as NotificationRepository,
      new FakeLogger().as<PinoLogger>(),
    );
  });

  // The service's whole tenancy contribution is passing BOTH halves of the
  // caller's context down. Each mutation gets its own assertion because any
  // one of them individually forgetting orgId re-opens the original leak.
  it('lists within the caller organization', async () => {
    await service.list(member, { skip: 0, limit: 20, unreadOnly: false });

    expect(repository.findForUser).toHaveBeenCalledWith(USER, ORG, expect.anything());
  });

  it('reads a single notification within the caller organization', async () => {
    await service.getById(member, NOTIF);

    expect(repository.findById).toHaveBeenCalledWith(NOTIF, USER, ORG);
  });

  it('marks as read within the caller organization', async () => {
    await service.markAsRead(member, NOTIF);

    expect(repository.markAsRead).toHaveBeenCalledWith(NOTIF, USER, ORG);
  });

  it('marks all as read within the caller organization', async () => {
    const result = await service.markAllAsRead(member);

    expect(result).toEqual({ count: 2 });
    expect(repository.markAllAsRead).toHaveBeenCalledWith(USER, ORG);
  });

  it('counts unread within the caller organization', async () => {
    await service.getUnreadCount(member);

    expect(repository.getUnreadCount).toHaveBeenCalledWith(USER, ORG);
  });

  it('deletes within the caller organization', async () => {
    await service.delete(member, NOTIF);

    expect(repository.delete).toHaveBeenCalledWith(NOTIF, USER, ORG);
  });

  it('deletes all within the caller organization', async () => {
    const result = await service.deleteAll(member);

    expect(result).toEqual({ count: 3 });
    expect(repository.deleteAll).toHaveBeenCalledWith(USER, ORG);
  });

  // A notification outside the boundary must be indistinguishable from one
  // that does not exist.
  it('reports an out-of-scope notification as not found', async () => {
    repository.findById!.mockResolvedValue(null);

    await expect(service.getById(member, NOTIF)).rejects.toThrow(NotFoundException);
  });

  it('reports an out-of-scope delete as not found', async () => {
    repository.delete!.mockResolvedValue(false);

    await expect(service.delete(member, NOTIF)).rejects.toThrow(NotFoundException);
  });

  it('serialises dates so the response is JSON, not Date objects', async () => {
    const result = await service.list(member, { skip: 0, limit: 20, unreadOnly: false });

    expect(result.data[0]!.createdAt).toBe(now.toISOString());
  });
});
