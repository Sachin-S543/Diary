/*
 * Inkrypt
 * Copyright (C) 2025 Sachin-S543
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import nodemailer from 'nodemailer';

// All email config comes from environment — never hardcoded
const createTransport = () => {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || `noreply@${process.env.APP_DOMAIN || 'inkrypt.app'}`;

    if (!host || !user || !pass) {
        console.warn('[Email] SMTP not configured — emails will be logged to console only');
        return null;
    }

    return { transporter: nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } }), from };
};

const appName = () => process.env.APP_NAME || 'Inkrypt';

export const sendOtpEmail = async (to: string, code: string): Promise<void> => {
    const config = createTransport();

    const subject = `Your ${appName()} verification code`;
    const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || '10';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
          <tr>
            <td style="background:#0f172a;padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">${appName()}</h1>
              <p style="color:#94a3b8;margin:8px 0 0;font-size:13px;">Your private, encrypted diary</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#0f172a;font-size:20px;font-weight:600;margin:0 0 12px;">Verify your email</h2>
              <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 32px;">
                Use the code below to complete your registration. This code expires in <strong>${expiryMinutes} minutes</strong>.
              </p>
              <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;margin-bottom:32px;">
                <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#0f172a;font-family:monospace;">${code}</span>
              </div>
              <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
                If you did not request this, you can safely ignore this email.
                Your account will not be created without verifying this code.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
                ${appName()} is open source (AGPLv3). Your data is always encrypted — we never have access to your diary.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    if (!config) {
        // Dev mode fallback — print to console
        console.log(`\n========= OTP EMAIL (console fallback) =========`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Code: ${code}`);
        console.log(`================================================\n`);
        return;
    }

    await config.transporter.sendMail({
        from: `"${appName()}" <${config.from}>`,
        to,
        subject,
        html,
    });
};
