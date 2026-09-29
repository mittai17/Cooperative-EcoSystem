# Mobile API foundation contract

Base path: `/api/v1`. Existing mobile dashboard, learning, career and downloads
contracts are in [MOBILE_BACKEND.md](MOBILE_BACKEND.md). Interactive OpenAPI is
served at `/docs`; the full machine-readable schema is `/openapi.json`.

Authenticated endpoints use `Authorization: Bearer <Clerk session JWT>` and
resolve the caller from the local active user row. New endpoints never accept
an anonymous actor ID. Missing/invalid tokens return 401; unprovisioned or
inactive users return 403. Validation errors return 422. Resource lookups
limited to an owner return 404 when the resource belongs to someone else.

## Capabilities

`GET /system/integrations` is public. It returns `integrations`, keyed by
provider name, and `features`. Each provider reports `configured`,
`implemented`, `available`, and `status` (`ready`, `not_configured`, or
`not_implemented`). `available` means its implementation and required settings
exist, not that an upstream request has succeeded. `health_checked` is false.
No credential values, file paths, provider errors, or account IDs are exposed.
Gemini currently has an adapter; the other listed external integrations are
pending. Inbox notifications are available; remote push is pending even when
FCM credentials and device tokens have been supplied.

## Notifications

All notification routes require an active provisioned user:

| Method and path | Request / response |
| --- | --- |
| `GET /notifications` | `limit` 1–100 (default 50), `offset` >= 0, `unread_only` bool. Returns `{items, unread_count, limit, offset}` newest first. |
| `POST /notifications/{id}/read` | Marks an owned item read and returns it. Repeated calls preserve the original timestamp. |
| `POST /notifications/devices` | JSON `{token, provider: "expo" or "fcm", platform?: "android" or "ios" or "web"}`. Returns 201 `{id, registered: true, remote_push_available: false}`. Re-registering a token updates its owner to the current signed-in user. |
| `DELETE /notifications/devices/{id}` | Idempotently removes an owned registration; returns 204. Call on sign-out before discarding the session. |

Each inbox item contains `id`, `kind`, nullable `title`, `body`, `payload`,
`read_at`, and `created_at`. UUIDs are strings and timestamps are ISO 8601.
Unread count always counts every unread owned item regardless of pagination.
Push tokens are never returned by inbox or registration responses.

Backend features call `await services.notifications.notify(db, user_id, kind,
payload, title=..., body=...)` in the same transaction as the originating
change. The service flushes but does not commit; rollback removes the event
with its change. Device registration does not claim delivery, and inbox
creation does not enqueue a push until a delivery worker is implemented.

## Seeds and configuration

`backend/.env.example` lists configuration names without credentials. Optional
integrations may remain empty. `backend/app/seeds` supplies a domain registry;
legacy seed commands remain explicit until each domain is migrated. Never run
agent migrations or seed commands against the production/main database.

Feature work still in progress is specified in
[MOBILE_COMPLETION_PLAN.md](MOBILE_COMPLETION_PLAN.md); this document describes
implemented foundation behavior, not a claim that all planned APIs exist.
