import nodemailer from 'nodemailer';

// Single shared transport (same env vars the previous otpSender.js used).
let transporter;
function getTransport() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
            port: 587,
            secure: false,
        });
    }
    return transporter;
}

/**
 * Generic mail dispatch. Never throws — a failed send must not break the
 * surrounding request (e.g. forgot-password must still return its generic 200).
 * Returns true/false so callers can log outcomes.
 */
export async function sendMail({ to, subject, html, text }) {
    try {
        await getTransport().sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME,
            to,
            subject,
            html,
            ...(text ? { text } : {}),
        });
        return true;
    } catch (error) {
        console.error(`[mailer] failed to send "${subject}" to ${to}:`, error.message);
        return false;
    }
}

// ---------------------------------------------------------------- templates

const BRAND = {
    name: 'The Wedding Boys',
    accent: '#e11d48',
    site: process.env.SITE_URL || 'https://www.theweddingboys.in',
};

// Shared shell so every transactional email looks consistent in any client.
const shell = ({ heading, body, ctaLabel, ctaUrl, footnote }) => `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading}</title></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <tr>
          <td style="background:${BRAND.accent};padding:22px 28px;">
            <span style="color:#fff;font-size:13px;letter-spacing:.22em;text-transform:uppercase;font-weight:600;">${BRAND.name}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px 8px;">
            <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:#111827;">${heading}</h1>
            <div style="font-size:15px;line-height:1.6;color:#4b5563;">${body}</div>
          </td>
        </tr>
        ${ctaUrl ? `
        <tr>
          <td style="padding:24px 28px 8px;">
            <a href="${ctaUrl}" style="display:inline-block;background:${BRAND.accent};color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:15px;font-weight:600;">${ctaLabel}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 28px 0;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">Or paste this link into your browser:</p>
            <p style="margin:4px 0 0;font-size:12px;color:#6b7280;word-break:break-all;">${ctaUrl}</p>
          </td>
        </tr>` : ''}
        ${footnote ? `
        <tr><td style="padding:22px 28px 0;">
          <p style="margin:0;font-size:13px;color:#6b7280;">${footnote}</p>
        </td></tr>` : ''}
        <tr>
          <td style="padding:28px;">
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 14px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

export function passwordResetEmail({ name, resetUrl }) {
    return {
        subject: 'Reset your password — The Wedding Boys',
        html: shell({
            heading: 'Reset your password',
            body: `<p style="margin:0 0 12px;">Hi${name ? ` ${name}` : ''},</p>
                   <p style="margin:0;">We received a request to reset the password for your admin account. Click the button below to choose a new one.</p>`,
            ctaLabel: 'Reset password',
            ctaUrl: resetUrl,
            footnote: 'This link expires in 1 hour. If you didn\'t request a reset, you can safely ignore this email — your password will stay the same.',
        }),
        text: `Reset your password: ${resetUrl} (expires in 1 hour)`,
    };
}

export function adminInviteEmail({ inviteUrl, role, invitedByName }) {
    return {
        subject: "You've been invited to manage The Wedding Boys",
        html: shell({
            heading: "You've been invited",
            body: `<p style="margin:0 0 12px;">${invitedByName ? `${invitedByName} has` : 'You have been'} invited you to join the <strong>${BRAND.name}</strong> admin dashboard as
                   <strong style="color:${BRAND.accent};">${role}</strong>.</p>
                   <p style="margin:0;">Accept the invitation below to set your name and password.</p>`,
            ctaLabel: 'Accept invitation',
            ctaUrl: inviteUrl,
            footnote: 'This invitation expires in 7 days. If you weren\'t expecting it, you can ignore this email.',
        }),
        text: `You've been invited to manage ${BRAND.name} as ${role}. Accept: ${inviteUrl}`,
    };
}
