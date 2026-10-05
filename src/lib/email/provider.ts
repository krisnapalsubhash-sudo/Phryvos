export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isSimulated?: boolean;
}

export class EmailDeliveryError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'EmailDeliveryError';
  }
}

// In-memory record of sent emails for automated testing and local inspection
const sentEmailsStore: Array<EmailPayload & { sentAt: Date; result: EmailResult }> = [];

export function getSentEmails() {
  return [...sentEmailsStore];
}

export function clearSentEmails() {
  sentEmailsStore.length = 0;
}

/**
 * Universal email delivery abstraction.
 * Integrates with Resend API when RESEND_API_KEY is available.
 * Supports development logging and in-memory test observation.
 */
export async function deliverEmail(payload: EmailPayload): Promise<EmailResult> {
  const fromAddress = process.env.EMAIL_FROM || 'Phryvos <noreply@phryvos.in>';
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new EmailDeliveryError(`Resend API rejected email: ${data.message || response.statusText}`);
      }

      const result: EmailResult = { success: true, messageId: data.id };
      sentEmailsStore.push({ ...payload, sentAt: new Date(), result });
      return result;
    } catch (error) {
      console.error('[Email Provider] Failed to send email via Resend:', error);
      if (process.env.NODE_ENV === 'production') {
        throw new EmailDeliveryError('Failed to deliver email through configured email provider', error);
      }
    }
  }

  // Development, test, or fallback delivery
  const isDevOrTest = process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_MAIL === 'true';
  const result: EmailResult = {
    success: true,
    messageId: `simulated-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    isSimulated: true,
  };

  sentEmailsStore.push({ ...payload, sentAt: new Date(), result });

  if (isDevOrTest) {
    console.log(`[Email Service (Dev/Test)] Email to: ${payload.to} | Subject: "${payload.subject}"`);
  } else {
    console.warn(`[Email Service Warning] No production email provider configured (set RESEND_API_KEY). Simulated delivery to: ${payload.to}`);
  }

  return result;
}
