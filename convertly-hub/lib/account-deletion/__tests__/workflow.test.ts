import {
  AccountDeletionSelfApprovalError,
  cancelOwnAccountDeletionRequest,
  processAccountDeletionRequest,
  requestAccountDeletion,
} from '../workflow';
import { prisma } from '@/lib/prisma';
import { getStorageService } from '@/lib/storage/s3';
import { sendAccountDeletionRequestedNotification } from '@/lib/mail/send-auth-email';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    user: { findUnique: jest.fn(), deleteMany: jest.fn() },
    accountDeletionRequest: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    accountDeletionEvent: { create: jest.fn() },
    conversionLog: { findMany: jest.fn() },
  },
}));
jest.mock('@/lib/storage/s3', () => ({ getStorageService: jest.fn() }));
jest.mock('@/lib/mail/send-auth-email', () => ({
  sendAccountDeletionRequestedNotification: jest.fn(),
  sendAccountDeletionCompletedNotification: jest.fn(),
  sendAccountDeletionFailedNotification: jest.fn(),
  sendAccountDeletionCancelledNotification: jest.fn(),
}));

const mockedPrisma = jest.mocked(prisma, { shallow: false });
const mockedStorage = jest.mocked(getStorageService);
const mockedRequestNotification = jest.mocked(sendAccountDeletionRequestedNotification);

describe('account deletion workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPrisma.$transaction.mockImplementation(async (callback) =>
      callback(mockedPrisma as never),
    );
    mockedRequestNotification.mockResolvedValue(undefined);
  });

  it('creates one pending request and an audit event for an active user', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      status: 'ACTIVE',
    } as never);
    mockedPrisma.accountDeletionRequest.findUnique.mockResolvedValue(null);
    mockedPrisma.accountDeletionRequest.create.mockResolvedValue({
      id: 'request-1',
      userEmail: 'user@example.com',
    } as never);

    await expect(requestAccountDeletion('user-1')).resolves.toMatchObject({
      alreadyRequested: false,
    });
    expect(mockedPrisma.accountDeletionRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-1', userEmail: 'user@example.com' }),
      }),
    );
    expect(mockedRequestNotification).toHaveBeenCalledWith('request-1', 'user@example.com');
  });

  it('does not create another request or notification while one is pending', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      status: 'ACTIVE',
    } as never);
    mockedPrisma.accountDeletionRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      status: 'PENDING',
    } as never);

    await expect(requestAccountDeletion('user-1')).resolves.toMatchObject({
      alreadyRequested: true,
    });
    expect(mockedPrisma.accountDeletionRequest.create).not.toHaveBeenCalled();
    expect(mockedRequestNotification).not.toHaveBeenCalled();
  });

  it('lets the owner cancel only a pending deletion request and records an audit event', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      email: 'user@example.com',
      status: 'ACTIVE',
    } as never);
    mockedPrisma.accountDeletionRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      status: 'PENDING',
    } as never);
    mockedPrisma.accountDeletionRequest.updateMany.mockResolvedValue({ count: 1 } as never);
    mockedPrisma.accountDeletionRequest.update.mockResolvedValue({
      id: 'request-1',
      status: 'CANCELLED',
    } as never);

    await expect(cancelOwnAccountDeletionRequest('user-1')).resolves.toMatchObject({
      status: 'CANCELLED',
    });
    expect(mockedPrisma.accountDeletionRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'CANCELLED' }) }),
    );
  });

  it('forbids an administrator from confirming their own request', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      email: 'admin@example.com',
      role: 'ADMIN',
      status: 'ACTIVE',
    } as never);
    mockedPrisma.accountDeletionRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      userId: 'admin-1',
      userEmail: 'admin@example.com',
      status: 'PENDING',
    } as never);

    await expect(processAccountDeletionRequest('admin-1', 'request-1')).rejects.toBeInstanceOf(
      AccountDeletionSelfApprovalError,
    );
    expect(mockedPrisma.accountDeletionRequest.updateMany).not.toHaveBeenCalled();
  });

  it('removes S3 conversion objects before deleting the user and completing the request', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      email: 'admin@example.com',
      role: 'ADMIN',
      status: 'ACTIVE',
    } as never);
    mockedPrisma.accountDeletionRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      userId: 'user-1',
      userEmail: 'user@example.com',
      status: 'PENDING',
    } as never);
    mockedPrisma.accountDeletionRequest.updateMany.mockResolvedValue({ count: 1 } as never);
    mockedPrisma.accountDeletionEvent.create.mockResolvedValue({} as never);
    mockedPrisma.conversionLog.findMany.mockResolvedValue([
      { storageKey: 'users/user-1/conversions/file.pdf' },
    ] as never);
    const deleteFile = jest.fn().mockResolvedValue(undefined);
    mockedStorage.mockReturnValue({ deleteFile } as never);
    mockedPrisma.user.deleteMany.mockResolvedValue({ count: 1 } as never);
    mockedPrisma.accountDeletionRequest.update.mockResolvedValue({} as never);

    await expect(processAccountDeletionRequest('admin-1', 'request-1')).resolves.toEqual({
      id: 'request-1',
      status: 'COMPLETED',
    });
    expect(deleteFile).toHaveBeenCalledWith('users/user-1/conversions/file.pdf');
    expect(mockedPrisma.user.deleteMany).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    expect(mockedPrisma.accountDeletionRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'COMPLETED', userId: null }),
      }),
    );
  });
});
