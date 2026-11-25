import nodemailer from "nodemailer";

type Transporter = ReturnType<typeof nodemailer.createTransport>;
let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export interface SendResult {
  sent: boolean;
}

/**
 * Sends a plain-text email if SMTP_* is configured on the server. If it isn't (e.g. in local
 * development, or before you've set up an email provider), this logs the message to the server
 * console instead of failing, so password reset can still be exercised end to end.
 */
export async function sendMail(to: string, subject: string, text: string): Promise<SendResult> {
  const t = getTransporter();
  if (!t) {
    // eslint-disable-next-line no-console
    console.log(`[mail] SMTP not configured — would have sent to ${to}: "${subject}"\n${text}`);
    return { sent: false };
  }
  await t.sendMail({ from: process.env.MAIL_FROM ?? process.env.SMTP_USER, to, subject, text });
  return { sent: true };
}
