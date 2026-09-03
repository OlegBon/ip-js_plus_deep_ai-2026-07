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

function smtpFailureDetails(error: unknown) {
  const smtpError: Record<string, unknown> =
    typeof error === "object" && error !== null ? (error as Record<string, unknown>) : {};

  return {
    errorName: error instanceof Error ? error.name : "UnknownError",
    code: typeof smtpError.code === "string" ? smtpError.code : undefined,
    command: typeof smtpError.command === "string" ? smtpError.command : undefined,
    responseCode: typeof smtpError.responseCode === "number" ? smtpError.responseCode : undefined,
  };
}

async function sendEmail(
  kind: "password-reset" | "email-verification",
  to: string,
  subject: string,
  text: string,
) {
  try {
    await createTransport().sendMail({
      from: process.env.SMTP_FROM ?? "Convertly Hub <no-reply@convertly.local>",
      to,
      subject,
      text,
    });
  } catch (error) {
    // Do not log recipients, message text, tokens, SMTP credentials or raw provider responses.
    console.error("Authentication email delivery failed.", { kind, ...smtpFailureDetails(error) });
    throw error;
  }
}

export function passwordResetUrl(token: string) {
  return `${appUrl()}/password-reset/${encodeURIComponent(token)}`;
}

export function emailVerificationUrl(token: string) {
  return `${appUrl()}/email-verification/${encodeURIComponent(token)}`;
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = passwordResetUrl(token);
  await sendEmail(
    "password-reset",
    to,
    "Reset your Convertly Hub password",
    `Open this one-time link within 30 minutes to reset your password:\n${url}`,
  );
}

export async function sendEmailVerification(to: string, token: string) {
  const url = emailVerificationUrl(token);
  await sendEmail(
    "email-verification",
    to,
    "Verify your Convertly Hub email",
    `Open this one-time link within 30 minutes to verify your email:\n${url}`,
  );
}
