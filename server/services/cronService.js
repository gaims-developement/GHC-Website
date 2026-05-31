const http = require('http');
const https = require('https');

const DEFAULT_INTERVAL_MINUTES = 5;
const DEFAULT_TIMEOUT_MS = 10000;
let healthCheckTimer;
let healthCheckRunning = false;

const isCronEnabled = () => process.env.CRON_ENABLED === 'true';

const getIntervalMs = () => {
  const intervalMinutes = Number(process.env.CRON_INTERVAL_MINUTES || DEFAULT_INTERVAL_MINUTES);
  const safeMinutes = Number.isFinite(intervalMinutes) && intervalMinutes >= 5 ? intervalMinutes : DEFAULT_INTERVAL_MINUTES;
  return safeMinutes * 60 * 1000;
};

const buildHealthUrl = () => {
  if (!process.env.APP_URL) return null;
  return new URL('/api/system/health', process.env.APP_URL).toString();
};

const requestJson = (url, timeoutMs = DEFAULT_TIMEOUT_MS) => new Promise((resolve, reject) => {
  const startedAt = Date.now();
  const target = new URL(url);
  const client = target.protocol === 'https:' ? https : http;

  const request = client.get(target, { timeout: timeoutMs }, (response) => {
    let body = '';

    response.setEncoding('utf8');
    response.on('data', (chunk) => {
      body += chunk;
    });
    response.on('end', () => {
      let data = {};
      if (body) {
        try {
          data = JSON.parse(body);
        } catch (error) {
          return reject(new Error(`Health endpoint returned invalid JSON: ${error.message}`));
        }
      }

      return resolve({
        data,
        statusCode: response.statusCode,
        responseTimeMs: Date.now() - startedAt,
      });
    });
  });

  request.on('timeout', () => {
    request.destroy(new Error(`Health check timed out after ${timeoutMs}ms`));
  });
  request.on('error', reject);
});

const runHealthCheck = async () => {
  if (healthCheckRunning) {
    console.log('[CRON] Previous health check still running; skipping this cycle');
    return;
  }

  const healthUrl = buildHealthUrl();
  if (!healthUrl) {
    console.warn('[CRON] Health check skipped: APP_URL is not configured');
    return;
  }

  healthCheckRunning = true;
  console.log('[CRON] Health check started');

  try {
    const result = await requestJson(healthUrl, Number(process.env.CRON_TIMEOUT_MS || DEFAULT_TIMEOUT_MS));
    console.log(`[CRON] Response time: ${result.responseTimeMs}ms`);

    if (result.statusCode >= 200 && result.statusCode < 300 && result.data.status === 'healthy') {
      console.log('[CRON] Health check successful');
      console.log(`[CRON] Database ${result.data.database === 'connected' ? 'healthy' : result.data.database || 'unknown'}`);
      return;
    }

    console.warn('[CRON] Health check failed');
    console.warn({
      statusCode: result.statusCode,
      status: result.data.status,
      database: result.data.database,
      error: result.data.error,
    });
  } catch (error) {
    console.error('[CRON] Health check failed');
    console.error({
      message: error.message,
      code: error.code,
    });
  } finally {
    healthCheckRunning = false;
  }
};

/**
 * Starts the in-process production health keep-alive loop.
 *
 * Required environment variables:
 *   APP_URL=https://<backend-domain>
 *   CRON_ENABLED=true
 *   CRON_INTERVAL_MINUTES=5
 *
 * Railway Cron Jobs alternative:
 *   Configure a Railway scheduled job with the standard every-five-minutes
 *   cron expression in the Railway dashboard.
 *   Command:
 *     node -e "fetch(process.env.APP_URL + '/api/system/health').then(r => console.log(r.status)).catch(e => { console.error(e); process.exit(1); })"
 *
 * The in-process loop is useful for continuous keep-alive checks while the API
 * is running. Railway's scheduled cron jobs are useful when you want Railway to
 * invoke a separate scheduled command at the platform level.
 */
// Railway cron expression for every 5 minutes: */5 * * * *
const startCronJobs = () => {
  if (!isCronEnabled()) {
    console.log('[CRON] Disabled. Set CRON_ENABLED=true to enable health checks.');
    return;
  }

  const healthUrl = buildHealthUrl();
  if (!healthUrl) {
    console.warn('[CRON] Disabled: APP_URL must be configured to run health checks.');
    return;
  }

  const intervalMs = getIntervalMs();
  console.log(`[CRON] Health check scheduled every ${intervalMs / 60000} minute(s)`);
  console.log(`[CRON] Monitor URL: ${healthUrl}`);

  runHealthCheck();
  healthCheckTimer = setInterval(runHealthCheck, intervalMs);
};

const stopCronJobs = () => {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = undefined;
    console.log('[CRON] Health check scheduler stopped');
  }
};

module.exports = {
  runHealthCheck,
  startCronJobs,
  stopCronJobs,
};
