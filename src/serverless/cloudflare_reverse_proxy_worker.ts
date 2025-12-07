/**
 * Cloudflare Worker script for acting as a reverse proxy.
 * This script intercepts incoming HTTP requests and forwards them to a target URL.
 * It appends the incoming request path and query parameters to the target URL.
 */
import * as workersType from "@cloudflare/workers-types";

interface Env {
  PROXY_PASS_URL: string;
}

/**
 * Handles fetch events and proxies requests to the appropriate backend service.
 *
 * @param {workersType.Request} request - The incoming request object.
 * @param {Env} env - The environment variables object.
 * @returns {Promise<workersType.Response>} - The response from the backend service.
 */
const handleFetch = async (
  request: workersType.Request,
  env: Env,
): Promise<workersType.Response> => {
  const url = new URL(request.url);
  const targetUrl = new URL(url.pathname + url.search, env.PROXY_PASS_URL);
  const response = await fetch(targetUrl, {
    method: request.method,
    headers: request.headers as unknown as HeadersInit,
    body: request.body as unknown as BodyInit,
  });
  // workaround for the mismatching Cloudflare Request/Response/fetch vs Node implementation
  return response as unknown as workersType.Response;
};

export default {
  fetch: handleFetch,
} satisfies workersType.ExportedHandler<Env>;

export { handleFetch };
