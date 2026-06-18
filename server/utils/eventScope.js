const normalizeId = (value) => {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const SQL_IDENTIFIER_PATH_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$/;

const normalizeColumn = (column) => {
  const normalized = String(column || '').trim();
  if (SQL_IDENTIFIER_PATH_PATTERN.test(normalized)) return normalized;

  console.warn('Invalid event scope column; falling back to event_id', { column });
  return 'event_id';
};

const getEventIds = (req) => {
  const context = req?.eventContext || {};
  if (context.isGlobalView) return [];
  if (Array.isArray(context.eventIds) && context.eventIds.length > 0) {
    return context.eventIds.map(normalizeId).filter(Boolean);
  }
  const eventId = normalizeId(context.eventId);
  return eventId ? [eventId] : [];
};

const getCurrentEventId = (req) => normalizeId(req?.eventContext?.eventId);

const buildEventWhere = (req, column = 'event_id') => {
  const context = req?.eventContext || {};
  if (context.isGlobalView) return { clause: '', params: [] };

  const eventIds = getEventIds(req);
  if (eventIds.length === 0) return { clause: '', params: [] };
  const scopeColumn = normalizeColumn(column);
  if (eventIds.length === 1) return { clause: `${scopeColumn} = ?`, params: [eventIds[0]] };

  return {
    clause: `${scopeColumn} IN (${eventIds.map(() => '?').join(', ')})`,
    params: eventIds,
  };
};

const applyEventScope = (clauses, params, req, column = 'event_id') => {
  const scope = buildEventWhere(req, column);
  if (scope.clause) {
    clauses.push(scope.clause);
    params.push(...scope.params);
  }
};

module.exports = {
  applyEventScope,
  buildEventWhere,
  getCurrentEventId,
  getEventIds,
};
