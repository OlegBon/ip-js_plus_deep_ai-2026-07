import nodemailer from "nodemailer";

function appUrl() {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

function createTransport() {
  const port = Number.parseInt(process.env.SMTP_PORT ?? "1025", 10);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number.isSafeInteger(port) ? port : 1025,
    secure: process.env.SMTP_SECURE === "true",
    auth: user && password ? { user, pass: password } : undefined,
  });
}

async function sendEmail(to: string, subject: string, text: string) {
  await createTransport().sendMail({
    from: process.env.SMTP_FROM ?? "Convertly Hub <no-reply@convertly.local>",
    to,
    subject,
    text,
  });
}

export function passwordResetUrl(token: string) {
  return `${appUrl()}/password-reset/${encodeURIComponent(token)}`;
}

export function emailVerificationUrl(token: string) {
  return `${appUrl()}/email-verification/${encodeURIComponent(token)}`;
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = passwordResetUrl(token);
  await sendEmail(to, "Reset your Convertly Hub password", `Open this one-time link within 30 minutes to reset your password:\n${url}`);
}

export async function sendEmailVerification(to: string, token: string) {
  const url = emailVerificationUrl(token);
  await sendEmail(to, "Verify your Convertly Hub email", `Open this one-time link within 30 minutes to verify your email:\n${url}`);
}
