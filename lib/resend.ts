import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`;

  await resend.emails.send({
    from: "Peer Feedback Platform <onboarding@resend.dev>",
    to: email,
    subject: "Welcome to Peer Feedback Platform",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background:#0f172a;border-radius:16px 16px 0 0;padding:32px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:999px;padding:6px 16px;margin-bottom:16px;">
                <div style="width:8px;height:8px;background:#10b981;border-radius:50%;"></div>
                <span style="color:#6ee7b7;font-size:12px;font-weight:600;letter-spacing:0.05em;">PEER FEEDBACK PLATFORM</span>
              </div>
              <h1 style="color:#ffffff;font-size:26px;font-weight:700;margin:0;">Welcome, ${name}!</h1>
              <p style="color:#94a3b8;font-size:14px;margin:8px 0 0;">Your account is ready. Here are your login details.</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:32px;">

              <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
                You've been added to the Peer Feedback Platform by your admin. Use the credentials below to log in and start reviewing your teammates.
              </p>

              <!-- Credentials box -->
              <div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#94a3b8;text-transform:uppercase;">Your login credentials</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;">
                      <span style="font-size:12px;color:#64748b;font-weight:500;">Email</span><br>
                      <span style="font-size:15px;color:#0f172a;font-weight:600;">${email}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;border-top:1px solid #e2e8f0;">
                      <span style="font-size:12px;color:#64748b;font-weight:500;">Temporary password</span><br>
                      <span style="font-size:15px;color:#0f172a;font-weight:600;font-family:monospace;letter-spacing:0.05em;">${password}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:24px;">
                <a href="${loginUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:999px;text-decoration:none;letter-spacing:0.01em;">
                  Log in now →
                </a>
              </div>

              <!-- Steps -->
              <div style="border-top:1px solid #f1f5f9;padding-top:20px;">
                <p style="font-size:12px;font-weight:700;letter-spacing:0.06em;color:#94a3b8;text-transform:uppercase;margin:0 0 12px;">What to do next</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${["Log in with your credentials above", "Open your assigned feedback form", "Submit anonymous reviews for each teammate", "Check back for your AI-generated summary"].map((step, i) => `
                  <tr>
                    <td style="padding:6px 0;vertical-align:top;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width:24px;height:24px;background:#d1fae5;border-radius:50%;text-align:center;vertical-align:middle;">
                            <span style="font-size:11px;font-weight:700;color:#065f46;">${i + 1}</span>
                          </td>
                          <td style="padding-left:10px;font-size:13px;color:#475569;">${step}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>`).join("")}
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;border-top:1px solid #f1f5f9;">
              <p style="font-size:12px;color:#94a3b8;margin:0;">
                This email was sent by your institution's Peer Feedback Platform.<br>
                If you didn't expect this, please contact your admin.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}