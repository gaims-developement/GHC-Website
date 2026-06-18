# Event Context System

## Purpose

The Event Context System centralizes how the API determines which event a request is operating against. It is designed as a reusable middleware/helper layer and does not modify existing controllers yet.

## Middleware

File: `server/middleware/eventContextMiddleware.js`

Exports:

- `eventContext`
- `requireEvent()`
- `getCurrentEvent(req)`
- `canAccessEvent(req, eventId)`

## Context Shape

Every request that passes through `eventContext` receives:

```js
req.eventContext = {
  eventId,
  eventSlug,
  eventName,
  isGlobalView,
  isSuperAdmin
}
```

The implementation also includes `viewMode` and `eventIds` to support multi-event views without changing the required core fields.

## Event Resolution Order

The middleware resolves event context in this priority order:

1. Explicit route parameter
2. Query parameter
3. Request header
4. User-selected event stored in session/profile
5. System default active event

## Supported Inputs

Route parameters:

- `:eventId`
- `:event_id`
- `:eventSlug`
- `:event_slug`

Query parameters:

- `eventId`
- `event_id`
- `eventSlug`
- `event_slug`
- `event`
- `eventIds`
- `event_ids`
- `globalView`
- `global_view`
- `isGlobalView`

Headers:

- `x-event-id`
- `x-ghc-event-id`
- `x-event-slug`
- `x-ghc-event-slug`
- `x-event`
- `x-event-ids`
- `x-global-view`

Session/profile fields:

- `selectedEventId`
- `selected_event_id`
- `eventId`
- `event_id`
- `currentEventId`
- `current_event_id`
- `defaultEventId`
- `default_event_id`

## View Modes

### Single Event View

Used when one event is resolved by route, query, header, profile, session, or default active event.

Result:

```js
{
  eventId: 12,
  eventSlug: 'ghc-2026',
  eventName: 'GHC 2026',
  isGlobalView: false,
  isSuperAdmin: false
}
```

### Multi Event View

Used when a Super Admin requests multiple event IDs through `eventIds`, `event_ids`, or `x-event-ids`.

Result:

```js
{
  eventId: null,
  eventSlug: null,
  eventName: null,
  isGlobalView: false,
  isSuperAdmin: true,
  viewMode: 'multi',
  eventIds: [12, 13]
}
```

Non-Super Admin users are denied multi-event access.

### Global View

Used when a Super Admin requests all events through:

- `event=global`
- `event=all`
- `event=*`
- `globalView=true`
- `x-global-view: true`

Result:

```js
{
  eventId: null,
  eventSlug: null,
  eventName: null,
  isGlobalView: true,
  isSuperAdmin: true
}
```

Non-Super Admin users are denied global access.

## Default Active Event

If no explicit event is provided, the middleware selects a published event from the `events` table. It prefers an event whose date range includes the current time, then falls back to the most recent published event.

## Helper Behavior

### `getCurrentEvent(req)`

Returns `req.eventContext` when present. If the middleware has not run, it returns an empty context with the current user's Super Admin status.

### `requireEvent()`

Express middleware that rejects requests without a single event context. It also rejects Global View because those endpoints require one concrete event.

Use this later on controllers/routes that must never operate globally.

### `canAccessEvent(req, eventId)`

Returns true when:

- The user is a Super Admin.
- The user's profile/session has `allowedEventIds` and the event is included.
- The user's selected event matches the requested event.
- No event restriction model exists yet.

This keeps the helper compatible with the current database while leaving room for a future event membership table.

## Intended Route Integration

The layer can be mounted globally after optional authentication:

```js
app.use('/api', optionalAuth, eventContext);
```

Or applied selectively:

```js
router.get('/events/:eventId/registrations', requireAuth, eventContext, requireEvent(), handler);
```

Existing controllers have not been updated. They must explicitly read `req.eventContext` in a later event-scoping pass.

## Architecture

```text
Request
  |
  v
JWT optional/required auth
  |
  v
EventContext middleware
  |
  +-- Route param eventId/eventSlug
  +-- Query eventId/eventSlug/event/globalView/eventIds
  +-- Header x-event-id/x-event-slug/x-global-view
  +-- Session/profile selected event
  +-- Default active published event
  |
  v
req.eventContext
  |
  v
Controller/model query layer
```

## Next Integration Tasks

1. Mount `eventContext` on selected route groups.
2. Add `requireEvent()` to write routes that need a single event.
3. Update controllers to pass `req.eventContext.eventId` into model queries.
4. Update reports to support single-event, multi-event, and global Super Admin views.
5. Add tests for route parameter, query, header, profile, default event, global view, and multi-event resolution.
