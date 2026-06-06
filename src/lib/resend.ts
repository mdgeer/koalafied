// Resend integration for Koalafied
// Handles transactional report delivery email only — one send per submission,
// URL hardcoded in HTML at call time. Subscriber management stays in Kit.

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY");
}

const RESEND_API_KEY = process.env.RESEND_API_KEY as string;

export async function sendReportEmail(to: string, reportUrl: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Koalafied <koalafied@mattgeer.com>",
      to: [to],
      subject: "Your Koalafied PM report is ready",
      html: reportEmailHtml(reportUrl),
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
  }
}

function reportEmailHtml(reportUrl: string): string {
  return `
<p>Your Koalafied PM fit analysis is ready.</p>
<p style="margin:24px 0;">
  <a href="${reportUrl}"
     style="background:#000;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;display:inline-block;">
    View Your Report &rarr;
  </a>
</p>
<p>Or paste this link in your browser:<br>
  <a href="${reportUrl}">${reportUrl}</a>
</p>
<p style="color:#888;font-size:12px;margin-top:24px;">
  This link expires in 30 days. Run a fresh analysis any time at
  <a href="https://mattgeer.com/koalafied" style="color:#888;">mattgeer.com/koalafied</a>.
</p>
  `.trim();
}
