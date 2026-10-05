import { deliverEmail, EmailResult } from './provider';
import { buildVerificationUrl } from './url';

export interface SendVerificationEmailParams {
  email: string;
  username: string;
  token: string;
  verificationUrl?: string;
}

export function buildVerificationHtml(username: string, verificationUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your Phryvos account</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #f3f4f6; margin: 0; padding: 24px; }
    .container { max-width: 520px; margin: 0 auto; background-color: #121826; border: 1px solid #1f293d; border-radius: 20px; padding: 36px 28px; }
    .brand { font-size: 24px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px; }
    h1 { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
    p { font-size: 14px; line-height: 1.6; color: #9ca3af; margin: 12px 0; }
    .button-wrap { margin: 28px 0; text-align: center; }
    .button { display: inline-block; background-color: #6366f1; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 600; font-size: 14px; }
    .footer { font-size: 12px; color: #6b7280; margin-top: 32px; border-top: 1px solid #1f293d; padding-top: 16px; }
    .link-fallback { word-break: break-all; color: #818cf8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">Phryvos</div>
    <h1>Verify your email address</h1>
    <p>Hi @${username},</p>
    <p>Welcome to Phryvos! Please confirm your email address to activate your account and start connecting with people.</p>
    <div class="button-wrap">
      <a href="${verificationUrl}" class="button" target="_blank">Verify Email Address</a>
    </div>
    <p>This verification link will expire in 24 hours. If you did not create an account on Phryvos, you can safely ignore this email.</p>
    <div class="footer">
      <p>Button not working? Copy and paste this URL into your browser:</p>
      <p class="link-fallback">${verificationUrl}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function buildVerificationText(username: string, verificationUrl: string): string {
  return `
Hi @${username},

Welcome to Phryvos! Please confirm your email address to activate your account:

${verificationUrl}

This verification link will expire in 24 hours. If you did not create an account on Phryvos, you can safely ignore this email.

— Phryvos Team
  `.trim();
}

/**
 * Sends an email verification link to the given user.
 */
export async function sendVerificationEmail({
  email,
  username,
  token,
  verificationUrl: customUrl,
}: SendVerificationEmailParams): Promise<EmailResult> {
  const verificationUrl = customUrl || buildVerificationUrl(token);

  return deliverEmail({
    to: email,
    subject: 'Verify your Phryvos account',
    html: buildVerificationHtml(username, verificationUrl),
    text: buildVerificationText(username, verificationUrl),
  });
}
