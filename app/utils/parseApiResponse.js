/**
 * Safely parses a fetch Response as JSON, surfacing clear errors if a non-JSON payload is returned.
 */
export async function parseApiResponse(res) {
  const rawText = await res.text();
  if (!rawText) return {};

  try {
    return JSON.parse(rawText);
  } catch {
    throw new Error(
      `Server returned an unexpected response (${res.status}). If you just updated the code, restart the dev server.`
    );
  }
}
