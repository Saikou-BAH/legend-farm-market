function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderButton(href: string, label: string) {
  return `
    <p style="margin: 24px 0;">
      <a
        href="${escapeHtml(href)}"
        style="
          display: inline-block;
          background: #234b2c;
          color: #ffffff;
          text-decoration: none;
          padding: 12px 18px;
          border-radius: 999px;
          font-weight: 600;
        "
      >
        ${escapeHtml(label)}
      </a>
    </p>
  `
}

export function renderEmailLayout(input: {
  title: string
  preview?: string
  bodyHtml: string
}) {
  const preview = input.preview?.trim()

  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin:0;padding:24px;background:#f6f4ee;color:#1f2937;font-family:Arial,sans-serif;">
    ${
      preview
        ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preview)}</div>`
        : ''
    }
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border-collapse:collapse;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;">
                  Legend Farm Shop
                </p>
                <h1 style="margin:0 0 20px;font-size:28px;line-height:1.2;color:#111827;">
                  ${escapeHtml(input.title)}
                </h1>
                ${input.bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export function renderParagraph(text: string) {
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#374151;">${escapeHtml(text)}</p>`
}

export function renderRichParagraph(html: string) {
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#374151;">${html}</p>`
}

export function renderLink(href: string, label: string) {
  return `<a href="${escapeHtml(href)}" style="color:#234b2c;text-decoration:underline;">${escapeHtml(label)}</a>`
}

export function renderActionButton(href: string, label: string) {
  return renderButton(href, label)
}

export { escapeHtml }
