# Stage 1

## Notification System REST API Design

This document defines the REST API contract for a notification platform that allows logged-in users to receive, view, manage, and update notifications. The APIs are designed for a frontend application that displays notifications in a notification center, badge counter, toast messages, and real-time updates.

## Core Actions

- Create a notification for a user
- Fetch logged-in user's notifications
- Fetch unread notification count
- Mark one notification as read
- Mark all notifications as read
- Delete or archive a notification
- Subscribe to real-time notifications

## Common Headers

All protected APIs require authentication.

```http
Authorization: Bearer <access_token>
Content-Type: application/json
Accept: application/json
```

## Common Notification Object

```json
{
  "id": "notif_101",
  "userId": "user_123",
  "type": "system",
  "title": "Profile updated",
  "message": "Your profile details were updated successfully.",
  "status": "unread",
  "priority": "normal",
  "metadata": {
    "redirectUrl": "/profile",
    "entityType": "profile",
    "entityId": "user_123"
  },
  "createdAt": "2026-05-14T10:30:00.000Z",
  "readAt": null
}
```

## Notification Fields

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Unique notification id |
| `userId` | string | User who should receive the notification |
| `type` | string | Category such as `system`, `message`, `reminder`, `security` |
| `title` | string | Short notification title |
| `message` | string | Main notification text |
| `status` | string | `unread`, `read`, or `archived` |
| `priority` | string | `low`, `normal`, or `high` |
| `metadata` | object | Extra data needed by frontend |
| `createdAt` | string | ISO timestamp when created |
| `readAt` | string/null | ISO timestamp when read |

## 1. Create Notification

Creates a notification for a specific user. Usually this endpoint is called by backend services, admin tools, or internal workflows.

```http
POST /api/v1/notifications
```

### Request Body

```json
{
  "userId": "user_123",
  "type": "security",
  "title": "New login detected",
  "message": "A new login was detected from Chrome on Windows.",
  "priority": "high",
  "metadata": {
    "redirectUrl": "/security/activity",
    "ipAddress": "192.168.1.10"
  }
}
```

### Success Response

```json
{
  "success": true,
  "message": "Notification created successfully",
  "data": {
    "id": "notif_101",
    "userId": "user_123",
    "type": "security",
    "title": "New login detected",
    "message": "A new login was detected from Chrome on Windows.",
    "status": "unread",
    "priority": "high",
    "metadata": {
      "redirectUrl": "/security/activity",
      "ipAddress": "192.168.1.10"
    },
    "createdAt": "2026-05-14T10:30:00.000Z",
    "readAt": null
  }
}
```

## 2. Get Logged-In User Notifications

Returns notifications for the logged-in user. Supports pagination and filtering.

```http
GET /api/v1/notifications?status=unread&page=1&limit=20
```

### Query Parameters

| Parameter | Required | Description |
| --- | --- | --- |
| `status` | no | Filter by `unread`, `read`, or `archived` |
| `type` | no | Filter by notification type |
| `page` | no | Page number, default `1` |
| `limit` | no | Items per page, default `20` |

### Success Response

```json
{
  "success": true,
  "message": "Notifications fetched successfully",
  "data": [
    {
      "id": "notif_101",
      "userId": "user_123",
      "type": "security",
      "title": "New login detected",
      "message": "A new login was detected from Chrome on Windows.",
      "status": "unread",
      "priority": "high",
      "metadata": {
        "redirectUrl": "/security/activity"
      },
      "createdAt": "2026-05-14T10:30:00.000Z",
      "readAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 42,
    "totalPages": 3
  }
}
```

## 3. Get Unread Notification Count

Returns the unread notification count for the logged-in user. This is useful for header badges.

```http
GET /api/v1/notifications/unread-count
```

### Success Response

```json
{
  "success": true,
  "message": "Unread count fetched successfully",
  "data": {
    "unreadCount": 8
  }
}
```

## 4. Mark One Notification as Read

Marks a single notification as read.

```http
PATCH /api/v1/notifications/{notificationId}/read
```

### Success Response

```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "notif_101",
    "status": "read",
    "readAt": "2026-05-14T10:45:00.000Z"
  }
}
```

## 5. Mark All Notifications as Read

Marks all unread notifications of the logged-in user as read.

```http
PATCH /api/v1/notifications/read-all
```

### Success Response

```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": {
    "updatedCount": 8
  }
}
```

## 6. Archive Notification

Archives a notification without permanently deleting it.

```http
PATCH /api/v1/notifications/{notificationId}/archive
```

### Success Response

```json
{
  "success": true,
  "message": "Notification archived successfully",
  "data": {
    "id": "notif_101",
    "status": "archived"
  }
}
```

## 7. Delete Notification

Permanently deletes a notification owned by the logged-in user.

```http
DELETE /api/v1/notifications/{notificationId}
```

### Success Response

```json
{
  "success": true,
  "message": "Notification deleted successfully",
  "data": {
    "id": "notif_101"
  }
}
```

## Error Response Format

```json
{
  "success": false,
  "message": "Notification not found",
  "error": {
    "code": "NOTIFICATION_NOT_FOUND",
    "details": "No notification exists with id notif_999 for this user"
  }
}
```

## Real-Time Notification Mechanism

The system should use WebSocket for real-time delivery because notifications must be pushed immediately to logged-in users without repeated polling.

### WebSocket Endpoint

```http
GET /ws/notifications
```

### WebSocket Connection Headers

```http
Authorization: Bearer <access_token>
```

### Server-to-Client Event: New Notification

```json
{
  "event": "notification.created",
  "data": {
    "id": "notif_101",
    "type": "security",
    "title": "New login detected",
    "message": "A new login was detected from Chrome on Windows.",
    "status": "unread",
    "priority": "high",
    "metadata": {
      "redirectUrl": "/security/activity"
    },
    "createdAt": "2026-05-14T10:30:00.000Z"
  }
}
```

### Server-to-Client Event: Notification Count Updated

```json
{
  "event": "notification.unread_count_updated",
  "data": {
    "unreadCount": 9
  }
}
```

### Client-to-Server Event: Acknowledge Delivery

```json
{
  "event": "notification.delivered",
  "data": {
    "notificationId": "notif_101",
    "deliveredAt": "2026-05-14T10:30:05.000Z"
  }
}
```

If WebSocket is unavailable, the frontend can fall back to polling:

```http
GET /api/v1/notifications?status=unread&page=1&limit=20
```

# Stage 2

## Persistent Storage Recommendation

I suggest using PostgreSQL as the primary database.

PostgreSQL is a good fit because notifications are user-owned records with clear relationships, strong consistency requirements, filtering needs, pagination, and frequent updates from `unread` to `read`. It supports reliable transactions, indexing, JSONB metadata, and partitioning for large data volume.



## Database Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'unread',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  archived_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  CONSTRAINT notifications_status_check
    CHECK (status IN ('unread', 'read', 'archived')),
  CONSTRAINT notifications_priority_check
    CHECK (priority IN ('low', 'normal', 'high'))
);

CREATE INDEX idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

CREATE INDEX idx_notifications_user_status_created
  ON notifications (user_id, status, created_at DESC);

CREATE INDEX idx_notifications_user_unread
  ON notifications (user_id)
  WHERE status = 'unread' AND deleted_at IS NULL;

CREATE INDEX idx_notifications_metadata
  ON notifications USING GIN (metadata);
```

## Queries Based on REST APIs

### Create Notification

```sql
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  priority,
  metadata
)
VALUES (
  '2c7a5a4a-fb2d-44c9-a41b-41d1f3f8d123',
  'security',
  'New login detected',
  'A new login was detected from Chrome on Windows.',
  'high',
  '{"redirectUrl": "/security/activity", "ipAddress": "192.168.1.10"}'::jsonb
)
RETURNING *;
```

### Get Logged-In User Notifications

```sql
SELECT
  id,
  user_id,
  type,
  title,
  message,
  status,
  priority,
  metadata,
  created_at,
  read_at
FROM notifications
WHERE user_id = '2c7a5a4a-fb2d-44c9-a41b-41d1f3f8d123'
  AND deleted_at IS NULL
  AND status = 'unread'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

### Get Unread Notification Count

```sql
SELECT COUNT(*) AS unread_count
FROM notifications
WHERE user_id = '2c7a5a4a-fb2d-44c9-a41b-41d1f3f8d123'
  AND status = 'unread'
  AND deleted_at IS NULL;
```

### Mark One Notification as Read

```sql
UPDATE notifications
SET
  status = 'read',
  read_at = CURRENT_TIMESTAMP
WHERE id = '7d4a8a4e-5509-4480-b7f8-a243ad34e123'
  AND user_id = '2c7a5a4a-fb2d-44c9-a41b-41d1f3f8d123'
  AND deleted_at IS NULL
RETURNING id, status, read_at;
```

### Mark All Notifications as Read

```sql
UPDATE notifications
SET
  status = 'read',
  read_at = CURRENT_TIMESTAMP
WHERE user_id = '2c7a5a4a-fb2d-44c9-a41b-41d1f3f8d123'
  AND status = 'unread'
  AND deleted_at IS NULL;
```

### Archive Notification

```sql
UPDATE notifications
SET
  status = 'archived',
  archived_at = CURRENT_TIMESTAMP
WHERE id = '7d4a8a4e-5509-4480-b7f8-a243ad34e123'
  AND user_id = '2c7a5a4a-fb2d-44c9-a41b-41d1f3f8d123'
  AND deleted_at IS NULL
RETURNING id, status;
```

### Delete Notification

Soft delete is recommended so accidental deletion can be audited.

```sql
UPDATE notifications
SET deleted_at = CURRENT_TIMESTAMP
WHERE id = '7d4a8a4e-5509-4480-b7f8-a243ad34e123'
  AND user_id = '2c7a5a4a-fb2d-44c9-a41b-41d1f3f8d123'
RETURNING id;
```

## Data Growth Problems

As notification volume increases, the following problems can occur:

- Slow queries for notification lists and unread counts
- Large table size due to historical notifications
- Index bloat from frequent read/unread status updates
- High write traffic during bulk notification creation
- WebSocket fan-out pressure when many users are online
- Expensive pagination with large offsets

## Scaling Solutions

- Add indexes on `user_id`, `status`, and `created_at`
- Use cursor-based pagination instead of offset pagination for large datasets
- Partition the `notifications` table by month or by `created_at`
- Archive or delete old notifications after a retention period
- Cache unread counts in Redis and update them when notifications are created or read
- Use a message queue such as Kafka, RabbitMQ, or BullMQ for bulk notification processing
- Use Redis Pub/Sub or a dedicated WebSocket gateway for real-time delivery
- Use database read replicas for heavy read traffic
- Store only essential notification data in PostgreSQL and move old audit/history data to cheaper storage if required

## Cursor-Based Pagination Query

Instead of using large offsets, the frontend can request notifications created before the last item timestamp.

```sql
SELECT
  id,
  type,
  title,
  message,
  status,
  priority,
  metadata,
  created_at,
  read_at
FROM notifications
WHERE user_id = '2c7a5a4a-fb2d-44c9-a41b-41d1f3f8d123'
  AND deleted_at IS NULL
  AND created_at < '2026-05-14T10:30:00.000Z'
ORDER BY created_at DESC
LIMIT 20;
```

# Stage 3

## Query Review

Original query:

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

The query is logically accurate if the requirement is to fetch every unread notification for student `1042`, oldest first. So from a correctness point of view, it is fine.

But for an actual notification screen, I would not fetch all rows. A student may have hundreds or thousands of unread notifications over time. The API should return a limited page of results, usually the latest notifications first.

A better API query would be:

```sql
SELECT notificationID, studentID, notificationType, title, message, isRead, createdAt
FROM notifications
WHERE studentID = 1042
  AND isRead = false
ORDER BY createdAt DESC
LIMIT 20;
```

## Why It Is Slow

The table now has around `5,000,000` notifications. If there is no useful index, the database may scan a very large part of the table to find rows where:

```sql
studentID = 1042
AND isRead = false
```

After finding those rows, it may still need to sort them by `createdAt`. That means the database is doing two expensive things:

- checking too many rows
- sorting the matching rows after filtering

`SELECT *` also makes the query heavier because it reads every column, even if the frontend only needs title, message, type, status, and created time.

## What I Would Change

I would add a composite index that matches the filter and sort pattern:

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications (studentID, isRead, createdAt DESC);
```

Then use:

```sql
SELECT notificationID, studentID, notificationType, title, message, isRead, createdAt
FROM notifications
WHERE studentID = 1042
  AND isRead = false
ORDER BY createdAt DESC
LIMIT 20;
```

This index helps because the database can directly jump to notifications for one student, then only unread rows, already ordered by creation time.

If the product really wants oldest unread first, then create the index with ascending order:

```sql
CREATE INDEX idx_notifications_student_read_created_asc
ON notifications (studentID, isRead, createdAt ASC);
```

## Likely Computation Cost

Without a proper index, the cost is close to:

```text
O(N) scan + O(M log M) sort
```

Where:

- `N` is total notifications, around `5,000,000`
- `M` is the number of unread notifications found for that student

With the composite index, the cost becomes closer to:

```text
O(log N + K)
```

Where:

- `log N` is the cost to reach the matching index range
- `K` is the number of rows returned, for example `20`

In practice this is a very large improvement because the database stops scanning millions of records for every page load.

## Should We Add Indexes on Every Column?

No, adding indexes on every column is not a good idea.

Indexes improve read queries only when they match real filtering, sorting, or joining patterns. Too many indexes create their own problems:

- inserts become slower because every index must be updated
- updates become slower, especially when indexed columns change
- indexes consume extra disk space
- the query planner has more choices, but not necessarily better choices
- low-cardinality columns like `isRead` alone are usually not very useful as single-column indexes

For example, an index only on `isRead` is weak because many rows may have `isRead = false`. But `(studentID, isRead, createdAt)` is useful because it follows the actual query.

So the better rule is: add indexes for important access patterns, not blindly on every column.

## Query: Students Who Got Placement Notifications in Last 7 Days

Assuming there is a `students` table and `notifications.studentID` references `students.studentID`:

```sql
SELECT DISTINCT
  s.studentID,
  s.name,
  s.email
FROM students s
JOIN notifications n
  ON n.studentID = s.studentID
WHERE n.notificationType = 'Placement'
  AND n.createdAt >= NOW() - INTERVAL '7 days';
```

For MySQL, the date syntax would be:

```sql
SELECT DISTINCT
  s.studentID,
  s.name,
  s.email
FROM students s
JOIN notifications n
  ON n.studentID = s.studentID
WHERE n.notificationType = 'Placement'
  AND n.createdAt >= NOW() - INTERVAL 7 DAY;
```

Useful index for this query:

```sql
CREATE INDEX idx_notifications_type_created_student
ON notifications (notificationType, createdAt, studentID);
```

# Stage 4

## Problem

Right now notifications are fetched on every page load for every student. With 50,000 students and 5,000,000 notifications, this can easily overload the database. Most page loads probably ask the same question again and again: "Does this student have unread notifications?"

That is wasteful if the data has not changed.

## Suggested Solution

I would not depend only on direct database reads for every page load. I would combine these strategies:

- cache unread counts
- fetch notifications only when needed
- use real-time delivery for new notifications
- paginate notification history
- optimize database indexes

## 1. Cache Unread Count in Redis

The notification badge usually needs only the unread count, not the full notification list. Store unread count in Redis:

```text
notification:unread_count:student:1042 = 8
```

When a new notification is created, increment the count. When a notification is marked as read, decrement it.

Example:

```text
INCR notification:unread_count:student:1042
DECR notification:unread_count:student:1042
```

### Benefit

The header badge can load quickly without hitting the SQL database every time.

### Tradeoff

Redis becomes another moving part. If Redis and PostgreSQL/MySQL go out of sync, the count may be wrong. This can be fixed by recalculating the count from the database periodically or when a mismatch is detected.

## 2. Fetch Full Notifications Only When User Opens Notification Panel

Instead of loading all notifications on every page, the frontend should call:

```http
GET /api/v1/notifications?status=unread&limit=20
```

only when the user opens the notification dropdown/page.

### Benefit

This reduces unnecessary database calls. Many users will load pages without opening notifications.

### Tradeoff

The first opening of the notification panel may take a little time, but that is acceptable because it happens only when needed.

## 3. Use WebSocket for New Notifications

When a student is online, send new notifications through WebSocket:

```json
{
  "event": "notification.created",
  "data": {
    "id": "notif_101",
    "title": "Placement drive announced",
    "notificationType": "Placement",
    "createdAt": "2026-05-14T10:30:00.000Z"
  }
}
```

The frontend can update the badge and show a toast immediately.

### Benefit

The user gets real-time updates and the frontend does not need to keep polling the database.

### Tradeoff

WebSocket infrastructure is more complex than simple REST APIs. It needs connection management, authentication, reconnect logic, and scaling support if many users are online.

## 4. Use Polling as a Fallback

Some networks or browsers may not keep WebSocket connections stable. In that case, the frontend can poll less frequently:

```http
GET /api/v1/notifications/unread-count
```

For example, every 60 seconds instead of every page load.

### Benefit

Simple and reliable fallback.

### Tradeoff

Polling is not truly real-time and still creates repeated traffic, but controlled polling is much better than querying on every page load.

## 5. Use Cursor Pagination

For notification history, use cursor pagination instead of offset pagination.

```sql
SELECT notificationID, title, message, notificationType, isRead, createdAt
FROM notifications
WHERE studentID = 1042
  AND createdAt < '2026-05-14 10:30:00'
ORDER BY createdAt DESC
LIMIT 20;
```

### Benefit

This stays fast even when a student has many notifications.

### Tradeoff

The frontend must keep track of the last notification timestamp or cursor. It is slightly more work than simple page numbers.

## 6. Keep the Right Database Indexes

For the main notification list:

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications (studentID, isRead, createdAt DESC);
```

For placement notification searches:

```sql
CREATE INDEX idx_notifications_type_created_student
ON notifications (notificationType, createdAt, studentID);
```

### Benefit

The database reads fewer rows and avoids unnecessary sorting.

### Tradeoff

Indexes take storage and slow down writes slightly. But these two indexes are justified because they match important API queries.

## Final Approach

The best practical design is:

- PostgreSQL/MySQL stores the actual notifications
- Redis stores unread counts and short-lived cached notification pages
- WebSocket sends new notifications instantly
- REST API is used for history, read/archive/delete actions
- database indexes are added only for real query patterns

This reduces database load, improves page speed, and still keeps the system reliable because the SQL database remains the final source of truth.

# Stage 5

## Review of Proposed Notify All Implementation

Proposed pseudocode:

```text
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message)
        save_to_db(student_id, message)
        push_to_app(student_id, message)
```

This approach is simple, but it is not safe for 50,000 students.

The biggest issue is that everything happens inside one direct loop. If the Email API becomes slow, the whole process becomes slow. If the process crashes at student number `23,000`, then some students get the notification and others do not. It is also hard to retry only failed emails or failed app pushes.

It also puts sudden pressure on external email services, the database, and the real-time notification server at the same time.

## Problems With This Approach

- The HR request may timeout before all 50,000 students are processed
- Email API rate limits may be hit
- One failure can stop the whole operation
- There is no clean retry mechanism
- Database inserts happen one by one, which is slow
- Real-time pushes may overload the WebSocket server
- It is difficult to know how many notifications were sent, failed, or are still pending
- Duplicate notifications may be created if HR clicks the button twice

## Better Design

The HR action should create one notification campaign/job, then background workers should process it in batches.

Flow:

```text
HR clicks Notify All
        |
        v
Create notification_campaign record
        |
        v
Insert in-app notifications in batches
        |
        v
Push email jobs to queue
        |
        v
Workers send emails with retry and rate limiting
        |
        v
WebSocket service pushes in-app events to online students
```

The API should return quickly after creating the campaign:

```json
{
  "success": true,
  "message": "Notification campaign started",
  "data": {
    "campaignId": "campaign_2026_placement_01",
    "targetCount": 50000,
    "status": "processing"
  }
}
```

## Suggested Pseudocode

```text
function notify_all(student_ids, message):
    campaign_id = create_campaign(message, total_students=len(student_ids))

    for batch in split(student_ids, 1000):
        bulk_insert_notifications(campaign_id, batch, message)
        enqueue_email_jobs(campaign_id, batch, message)
        enqueue_realtime_push_jobs(campaign_id, batch, message)

    return campaign_id
```

Workers then process the queue:

```text
function email_worker(job):
    try:
        send_email(job.student_id, job.message)
        mark_email_sent(job.notification_id)
    catch error:
        retry_with_backoff(job)

function realtime_worker(job):
    if student_is_online(job.student_id):
        push_to_app(job.student_id, job.message)
    mark_in_app_created(job.notification_id)
```

## Database Tables

```sql
CREATE TABLE notification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  notification_type notification_type NOT NULL,
  target_count INT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'processing',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL
);

CREATE TABLE notification_delivery_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id),
  student_id UUID NOT NULL,
  campaign_id UUID NOT NULL REFERENCES notification_campaigns(id),
  email_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  app_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  email_attempts INT NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (campaign_id, student_id)
);
```

The unique constraint on `(campaign_id, student_id)` prevents duplicate notifications for the same campaign if the HR clicks twice or if a retry runs again.

## Batch Insert for In-App Notifications

Instead of 50,000 separate inserts, insert in batches.

Example:

```sql
INSERT INTO notifications (
  studentID,
  notificationType,
  title,
  message,
  isRead,
  createdAt
)
SELECT
  s.studentID,
  'Placement',
  'Placement notification',
  'A new placement announcement has been published.',
  false,
  NOW()
FROM students s
WHERE s.isActive = true;
```

If the system must target a selected list of students, pass the selected student ids through a temporary table or array and insert from that list.

## Queue and Worker Strategy

Use a queue such as BullMQ, RabbitMQ, Kafka, or AWS SQS.

Email jobs should be rate limited. For example, if the Email API allows `500` emails per minute, workers should respect that limit instead of sending all 50,000 immediately.

Recommended job fields:

```json
{
  "campaignId": "campaign_2026_placement_01",
  "notificationId": "notif_101",
  "studentId": "student_1042",
  "email": "student@example.com",
  "message": "A new placement announcement has been published.",
  "attempt": 1
}
```

## Real-Time Notification Handling

For in-app notifications, the database insert should be the source of truth. WebSocket push should be treated as delivery optimization.

If the student is online:

```json
{
  "event": "notification.created",
  "data": {
    "notificationId": "notif_101",
    "notificationType": "Placement",
    "title": "Placement notification",
    "message": "A new placement announcement has been published."
  }
}
```

If the student is offline, nothing is lost because the notification is already saved in the database. The student will see it on the next login or notification fetch.

## Failure Handling

The system should not fail the whole campaign because one email failed.

Use:

- retries with exponential backoff
- dead-letter queue for permanently failed jobs
- status table to track pending, sent, failed, and retried deliveries
- idempotency key using `campaignId + studentId`
- admin campaign status screen for HR

Example statuses:

```text
pending
processing
sent
failed
retrying
```

## Tradeoffs

Batch processing is more complex than a direct loop, but it is much safer. It gives retry, monitoring, and predictable load on the database and Email API.

Real-time push gives a better user experience, but it should not be the only delivery method. WebSocket connections can drop. Saving the notification first makes the system reliable even when the student is offline.

Queues add infrastructure, but they protect the main API from timeout and protect external services from sudden traffic spikes.

## Final Recommendation

For 50,000 students, I would use this approach:

- create a campaign record immediately
- insert notifications in database batches
- send emails through a queue with rate limiting
- push in-app notifications through WebSocket only for online users
- track delivery status per student
- retry failures in background
- prevent duplicates with an idempotency key or unique constraint

This design is slower than a direct loop in terms of total background processing time, but it is much more reliable and will not freeze the HR request or overload the database.
