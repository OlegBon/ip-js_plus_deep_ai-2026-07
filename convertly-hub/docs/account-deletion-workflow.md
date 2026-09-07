# Account deletion workflow

## Purpose

Account deletion is a two-person, server-side workflow. A signed-in user requests deletion in
**Dashboard → Profile**. An active administrator reviews and confirms it in **Admin Panel →
Account Deletion Requests**. The standard path is deliberately not a one-off job.

## State and audit trail

`AccountDeletionRequest` stores a snapshot of the requester's email and has one active request per
live user. `AccountDeletionEvent` records `REQUESTED`, `PROCESSING`, `COMPLETED`, and `FAILED`
events with the actor email and timestamp.

The request relation to `User` uses `ON DELETE SET NULL`. Therefore the request and audit trail
remain available after the user and its cascading records have been deleted, while the user ID is
removed. This retains operational evidence without retaining the deleted account itself.

| Status       | Meaning                                        | Next action                            |
| ------------ | ---------------------------------------------- | -------------------------------------- |
| `PENDING`    | User submitted a request.                      | Administrator may confirm it.          |
| `PROCESSING` | An administrator has claimed it.               | No concurrent confirmation is allowed. |
| `COMPLETED`  | Stored files and account records were removed. | Terminal state.                        |
| `FAILED`     | Storage or database removal did not finish.    | Administrator may retry safely.        |

Duplicate user submissions return the existing `PENDING` or `PROCESSING` request. A failed request
may be submitted again; this creates a new `REQUESTED` audit event and returns it to `PENDING`.

## Confirmation sequence

1. The administrator confirms the modal. The server verifies that the actor is an active admin and
   prevents an administrator from confirming their own deletion.
2. The request is atomically claimed as `PROCESSING`; an event is written first, preventing two
   administrators from deleting the same account concurrently.
3. The server reads the user's stored `ConversionLog.storageKey` values and deletes each S3 object.
   S3 `DeleteObject` is idempotent, so a retry after a partial failure is safe.
4. The server deletes `User`. Prisma/database cascades delete subscriptions, API keys and conversion
   records. Then the request becomes `COMPLETED` and an event is written.
5. If any storage/database step fails, the user remains (unless the database deletion had already
   committed), the request becomes `FAILED`, and the administrator can retry from the panel.

Never delete a user manually in Supabase Studio as a normal support operation: that bypasses the
S3 cleanup sequence.

## Mail notifications

The application sends operational notifications to `SUPPORT_EMAIL` when a request is created,
completed, or fails. Mail delivery never changes the deletion status: an SMTP outage must not make
the request disappear or cause deletion to be repeated. Set `SUPPORT_EMAIL=support@bon.kharkov.ua`
in the Northflank app runtime group (it is a non-secret value). The mailbox and SMTP variables must
remain configured as described in the cloud runbook.

## Production checklist

1. Run the migration job before deploying an app build containing this feature.
2. Add `SUPPORT_EMAIL` to `convertly-app-runtime`, then deploy/restart the app.
3. Use two test accounts: a regular user to create the request and a separate administrator to
   confirm it. The administrator's own request cannot be confirmed by that same administrator.
4. Verify in Supabase that the completed request and events remain but its `userId` is `NULL`.
5. Check the private S3 bucket does not contain the deleted user's conversion objects and check the
   support mailbox for the request and completion messages.

The first migration is `20260907150000_account_deletion_workflow`.
