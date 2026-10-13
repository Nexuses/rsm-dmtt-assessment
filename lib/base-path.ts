/** URL prefix this app is served under on hub.rsm.ae (`basePath` in next.config.js). */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Prefixes a root-relative path for raw `fetch()` calls and plain `<a href>`.
 * `next/link`, `router.push`, `redirect()` and middleware matchers add the
 * base path themselves.
 */
export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}

/** Cookie `Path` that keeps this app's cookies away from the other apps on the same host. */
export const COOKIE_PATH = BASE_PATH || "/";
