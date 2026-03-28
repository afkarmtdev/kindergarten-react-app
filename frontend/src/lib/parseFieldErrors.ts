/**
 * Parses a Zod validation error response from the backend (via Hono zValidator)
 * into a flat field→message map suitable for inline form error display.
 *
 * Returns null if the error is not a Zod validation error.
 *
 * Expected response shape (HTTP 400 from zValidator):
 * { success: false, error: { name: "ZodError", issues: [{ path: ["field"], message: "..." }] } }
 */
export function parseFieldErrors(
  err: unknown,
  fieldMap?: Record<string, string>
): Record<string, string> | null {
  const issues = (
    err as {
      response?: {
        data?: { error?: { issues?: Array<{ path: string[]; message: string }> } }
      }
    }
  )?.response?.data?.error?.issues

  if (!Array.isArray(issues) || issues.length === 0) return null

  const errors: Record<string, string> = {}
  for (const issue of issues) {
    const backendField = issue.path?.[0]
    if (!backendField) continue
    const frontendField = fieldMap?.[backendField] ?? backendField
    if (!errors[frontendField]) errors[frontendField] = issue.message
  }

  return Object.keys(errors).length > 0 ? errors : null
}
