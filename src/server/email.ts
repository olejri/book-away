import "server-only";
import { Resend } from "resend";
import { env } from "~/env.js";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(env.RESEND_API_KEY);
  return _resend;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail({ to, subject, body }: SendEmailOptions) {
  const { data, error } = await getResend().emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject,
    text: body,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

