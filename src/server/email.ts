import "server-only";
import { Resend } from "resend";
import { env } from "~/env.js";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(env.RESEND_API_KEY);
  return _resend;
}

export interface EmailAttachment {
  /** File name shown on the email / Trello card, e.g. "screenshot.jpg". */
  filename: string;
  /** Raw file bytes, base64-encoded (no data-URL prefix). */
  contentBase64: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail({
  to,
  subject,
  body,
  attachments,
}: SendEmailOptions) {
  const { data, error } = await getResend().emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject,
    text: body,
    attachments: attachments?.map((a) => ({
      filename: a.filename,
      content: Buffer.from(a.contentBase64, "base64"),
    })),
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

