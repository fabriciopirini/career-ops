/**
 * liveness-browser.mjs — Playwright-driven liveness check for a single URL.
 *
 * Shared by check-liveness.mjs (CLI tool) and scan.mjs (--verify flag).
 * Returns the same shape as classifyLiveness: { result, reason }.
 */

import { classifyLiveness } from './liveness-core.mjs';

const NAVIGATE_TIMEOUT_MS = 15_000;
const HYDRATION_WAIT_MS = 2_000;

// Defensive guards: URLs come from ATS feeds (mostly trusted) but a misconfigured
// portals.yml entry or a hijacked feed shouldn't be able to point Playwright at
// internal infrastructure. Only allow http(s) and reject loopback/private/link-local.
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
  /^fe80:/i,
];

// Returns null when the URL is safe to fetch, otherwise a structured guard
// result with a stable `code` (used for routing in scan.mjs) plus a human
// `reason`. Stable codes — not regex on reason strings — drive downstream
// dispatch so the wording can change freely without breaking callers.
function rejectPrivateOrInvalid(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { code: 'invalid_url', reason: 'invalid URL' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { code: 'unsupported_protocol', reason: `unsupported protocol ${parsed.protocol}` };
  }
  if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(parsed.hostname))) {
    return { code: 'blocked_host', reason: `blocked host ${parsed.hostname}` };
  }
  return null;
}

export function createLivenessRoutingState() {
  return { attempts: new Map(), persisted: new Map(), blacklist: new Set() };
}

export function routeRetryableLiveness(url, result, { state = createLivenessRoutingState(), maxAttempts = 2 } = {}) {
  if (!state || !(state.attempts instanceof Map) || !(state.persisted instanceof Map) || !(state.blacklist instanceof Set)) {
    throw new TypeError('state must be a liveness routing state');
  }
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) throw new RangeError('maxAttempts must be a positive integer');
  const key = String(url);
  if (state.blacklist.has(key)) {
    return { action: 'blacklist', result: { result: 'uncertain', code: 'blacklisted', reason: 'URL is persistently blacklisted' }, attempts: state.attempts.get(key) ?? 0 };
  }
  const attempts = (state.attempts.get(key) ?? 0) + 1;
  state.attempts.set(key, attempts);
  const retryable = result?.result === 'uncertain' && result?.code === 'navigation_error';
  if (retryable && attempts < maxAttempts) {
    return { action: 'retry', result, attempts, blacklisted: false };
  }
  const blacklist = result?.result === 'expired'
    || result?.code === 'no_apply_control'
    || result?.code === 'invalid_url'
    || result?.code === 'unsupported_protocol'
    || result?.code === 'blocked_host';
  if (blacklist) state.blacklist.add(key);
  state.persisted.set(key, result);
  return { action: 'persist', result, attempts, blacklisted: blacklist };
}

export function retryLiveness(attempt, { maxAttempts = 2, key = 'synthetic', state = createLivenessRoutingState() } = {}) {
  if (typeof attempt !== 'function') throw new TypeError('attempt must be a function');
  let result;
  for (;;) {
    result = attempt();
    if (result && typeof result.then === 'function') throw new TypeError('retryLiveness requires a synchronous attempt seam');
    const routed = routeRetryableLiveness(key, result, { state, maxAttempts });
    if (routed.action !== 'retry') return routed.result;
  }
}

export async function checkUrlLiveness(page, url, { routingState = createLivenessRoutingState(), maxAttempts = 2 } = {}) {
  const guardError = rejectPrivateOrInvalid(url);
  if (guardError) {
    return routeRetryableLiveness(url, { result: 'uncertain', code: guardError.code, reason: guardError.reason }, { state: routingState, maxAttempts }).result;
  }
  for (;;) {
    let result;
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAVIGATE_TIMEOUT_MS });
      const status = response?.status() ?? 0;

      // Give SPAs (Ashby, Lever, Workday) time to hydrate
      await page.waitForTimeout(HYDRATION_WAIT_MS);

      const finalUrl = page.url();
      const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
      const applyControls = await page.evaluate(() => {
        const candidates = Array.from(
          document.querySelectorAll('a, button, input[type="submit"], input[type="button"], [role="button"]')
        );

        return candidates
          .filter((element) => {
            if (element.closest('nav, header, footer')) return false;
            if (element.closest('[aria-hidden="true"]')) return false;

            const style = window.getComputedStyle(element);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            if (!element.getClientRects().length) return false;

            return Array.from(element.getClientRects()).some((rect) => rect.width > 0 && rect.height > 0);
          })
          .map((element) => {
            const label = [
              element.innerText,
              element.value,
              element.getAttribute('aria-label'),
              element.getAttribute('title'),
            ]
              .filter(Boolean)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();

            return label;
          })
          .filter(Boolean);
      });

      result = classifyLiveness({ status, finalUrl, bodyText, applyControls });
    } catch (err) {
      // Transient failures (timeout, DNS, TLS, 5xx) shouldn't be treated as expired —
      // doing so would cause scan --verify to drop the URL and write it to scan-history,
      // permanently filtering it out on subsequent scans.
      result = {
        result: 'uncertain',
        code: 'navigation_error',
        reason: `navigation error: ${err.message.split('\n')[0]}`,
      };
    }
    const routed = routeRetryableLiveness(url, result, { state: routingState, maxAttempts });
    if (routed.action !== 'retry') return routed.result;
  }
}
