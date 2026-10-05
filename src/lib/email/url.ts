/**
 * Generates trusted canonical URLs for authentication and verification.
 * Avoids open-redirect vulnerabilities and untrusted client headers.
 */
export function getCanonicalAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/+$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, '');
  }
  return 'https://www.phryvos.in';
}

export function buildVerificationUrl(token: string): string {
  const baseUrl = getCanonicalAppUrl();
  return `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
}
