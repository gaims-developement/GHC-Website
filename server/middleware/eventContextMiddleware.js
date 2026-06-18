const { pool } = require('../config/db');

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';
const GLOBAL_EVENT_TOKENS = new Set(['global', 'all', '*']);

const toStringOrNull = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

const toPositiveInt = (value) => {
  const normalized = Number.parseInt(value, 10);
  return Number.isInteger(normalized) && normalized > 0 ? normalized : null;
};

const normalizeBoolean = (value) => {
  if (value === true || value === false) return value;
  const normalized = toStringOrNull(value)?.toLowerCase();
  if (!normalized) return false;
  return ['1', 'true', 'yes', 'global', 'all'].includes(normalized);
};

const isSuperAdminUser = (user) => user?.role === SUPER_ADMIN_ROLE;

const normalizeEventRow = (event) => {
  if (!event) return null;

  return {
    id: event.id,
    slug: event.slug,
    name: event.title || null,
  };
};

const parseEventReference = (value) => {
  const normalized = toStringOrNull(value);
  if (!normalized) return null;

  if (GLOBAL_EVENT_TOKENS.has(normalized.toLowerCase())) {
    return { type: 'global' };
  }

  const numericId = toPositiveInt(normalized);
  if (numericId) {
    return { type: 'id', value: numericId };
  }

  return { type: 'slug', value: normalized };
};

const firstPresent = (...values) => values.find((value) => toStringOrNull(value) !== null);

const getExplicitRouteReference = (req) =>
  parseEventReference(
    firstPresent(
      req.params?.eventId,
      req.params?.event_id,
      req.params?.eventSlug,
      req.params?.event_slug
    )
  );

const getQueryReference = (req) =>
  parseEventReference(
    firstPresent(
      req.query?.eventId,
      req.query?.event_id,
      req.query?.eventSlug,
      req.query?.event_slug,
      req.query?.event
    )
  );

const getHeaderReference = (req) =>
  parseEventReference(
    firstPresent(
      req.get?.('x-event-id'),
      req.get?.('x-ghc-event-id'),
      req.get?.('x-event-slug'),
      req.get?.('x-ghc-event-slug'),
      req.get?.('x-event')
    )
  );

const getProfileReference = (req) =>
  parseEventReference(
    firstPresent(
      req.session?.selectedEventId,
      req.session?.selected_event_id,
      req.session?.eventId,
      req.session?.event_id,
      req.user?.selectedEventId,
      req.user?.selected_event_id,
      req.user?.currentEventId,
      req.user?.current_event_id,
      req.user?.defaultEventId,
      req.user?.default_event_id
    )
  );

const getRequestedGlobalView = (req) =>
  normalizeBoolean(req.query?.globalView) ||
  normalizeBoolean(req.query?.global_view) ||
  normalizeBoolean(req.query?.isGlobalView) ||
  normalizeBoolean(req.get?.('x-global-view'));

const getRequestedEventIds = (req) => {
  const raw = firstPresent(req.query?.eventIds, req.query?.event_ids, req.get?.('x-event-ids'));
  if (!raw) return [];

  return String(raw)
    .split(',')
    .map((value) => toPositiveInt(value))
    .filter(Boolean);
};

const findEvent = async (reference) => {
  if (!reference || reference.type === 'global') return null;

  const whereClause = reference.type === 'id' ? 'id = ?' : 'slug = ?';
  const [rows] = await pool.query(
    `SELECT id, slug, title
     FROM events
     WHERE ${whereClause}
     LIMIT 1`,
    [reference.value]
  );

  return normalizeEventRow(rows[0]);
};

const findDefaultActiveEvent = async () => {
  const [rows] = await pool.query(
    `SELECT id, slug, title
     FROM events
     WHERE status = 'published'
     ORDER BY
       CASE
         WHEN COALESCE(start_datetime, start_date) <= NOW()
          AND COALESCE(end_datetime, end_date, start_datetime, start_date) >= NOW()
         THEN 0
         ELSE 1
       END,
       COALESCE(start_datetime, start_date) DESC,
       created_at DESC
     LIMIT 1`
  );

  return normalizeEventRow(rows[0]);
};

const canAccessEvent = async (req, eventId) => {
  const normalizedEventId = toPositiveInt(eventId);
  if (!normalizedEventId) return false;
  if (isSuperAdminUser(req.user)) return true;

  const allowedEventIds =
    req.user?.allowedEventIds ||
    req.user?.allowed_event_ids ||
    req.session?.allowedEventIds ||
    req.session?.allowed_event_ids;

  if (Array.isArray(allowedEventIds) && allowedEventIds.length > 0) {
    return allowedEventIds.map((id) => toPositiveInt(id)).includes(normalizedEventId);
  }

  const selectedReference = getProfileReference(req);
  if (selectedReference?.type === 'id') {
    return selectedReference.value === normalizedEventId;
  }

  return true;
};

const buildContext = ({ event = null, isGlobalView = false, isSuperAdmin = false, eventIds = [] } = {}) => ({
  eventId: event?.id || null,
  eventSlug: event?.slug || null,
  eventName: event?.title || null,
  isGlobalView,
  isSuperAdmin,
  viewMode: isGlobalView ? 'global' : eventIds.length > 1 ? 'multi' : 'single',
  eventIds,
});

const eventContext = async (req, res, next) => {
  try {
    const isSuperAdmin = isSuperAdminUser(req.user);
    const requestedEventIds = getRequestedEventIds(req);
    const reference =
      getExplicitRouteReference(req) ||
      getQueryReference(req) ||
      getHeaderReference(req) ||
      getProfileReference(req);

    const globalRequested = reference?.type === 'global' || getRequestedGlobalView(req);
    if (globalRequested) {
      if (!isSuperAdmin) {
        return res.status(403).json({ message: 'Global event view requires Super Admin access' });
      }

      req.eventContext = buildContext({
        isGlobalView: true,
        isSuperAdmin,
        eventIds: requestedEventIds,
      });
      return next();
    }

    if (requestedEventIds.length > 1) {
      if (!isSuperAdmin) {
        return res.status(403).json({ message: 'Multi-event view requires Super Admin access' });
      }

      req.eventContext = buildContext({
        isSuperAdmin,
        eventIds: requestedEventIds,
      });
      return next();
    }

    const event = (await findEvent(reference)) || (await findDefaultActiveEvent());
    if (event && !(await canAccessEvent(req, event.id))) {
      return res.status(403).json({ message: 'You do not have access to this event' });
    }

    req.eventContext = buildContext({
      event,
      isSuperAdmin,
      eventIds: event ? [event.id] : [],
    });

    return next();
  } catch (error) {
    return next(error);
  }
};

const getCurrentEvent = (req) => req.eventContext || buildContext({ isSuperAdmin: isSuperAdminUser(req.user) });

const requireEvent = () => (req, res, next) => {
  const current = getCurrentEvent(req);

  if (current.isGlobalView) {
    return res.status(400).json({ message: 'This endpoint requires a single event context' });
  }

  if (!current.eventId) {
    return res.status(400).json({ message: 'Event context is required' });
  }

  return next();
};

module.exports = {
  canAccessEvent,
  eventContext,
  getCurrentEvent,
  requireEvent,
};
