import { marked } from 'marked';

export async function generateAndDownloadPdf(
  title: string,
  content: string,
  filename: string = 'document'
): Promise<void> {
  // Configure marked for GFM (tables, strikethrough, etc.)
  marked.setOptions({ gfm: true, breaks: true });

  const htmlBody = await marked.parse(content);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.7;
      color: #1a1a1a;
      padding: 48px 64px;
      max-width: 800px;
      margin: 0 auto;
    }

    h1.doc-title {
      font-size: 22pt;
      font-weight: 700;
      margin-bottom: 6px;
      color: #111;
      border-bottom: 2px solid #ccc;
      padding-bottom: 10px;
      margin-bottom: 24px;
    }

    h1 { font-size: 17pt; margin: 24px 0 10px; color: #111; }
    h2 { font-size: 14pt; margin: 20px 0 8px; color: #222; }
    h3 { font-size: 12pt; margin: 16px 0 6px; color: #333; }
    h4, h5, h6 { font-size: 11pt; margin: 12px 0 4px; color: #444; }

    p { margin: 0 0 12px; }

    a { color: #2563eb; text-decoration: underline; }

    strong { font-weight: 700; }
    em { font-style: italic; }
    del { text-decoration: line-through; color: #666; }

    ul, ol { margin: 8px 0 12px 24px; }
    li { margin-bottom: 4px; }
    li > ul, li > ol { margin-top: 4px; margin-bottom: 4px; }

    blockquote {
      border-left: 3px solid #bbb;
      margin: 12px 0;
      padding: 8px 16px;
      color: #555;
      font-style: italic;
      background: #f9f9f9;
    }

    code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 9.5pt;
      background: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 3px;
      padding: 1px 4px;
    }

    pre {
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 12px 16px;
      margin: 12px 0;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }

    pre code {
      background: none;
      border: none;
      padding: 0;
      font-size: 9pt;
      line-height: 1.5;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 10.5pt;
    }

    th {
      background: #f0f0f0;
      font-weight: 700;
      text-align: left;
      padding: 8px 12px;
      border: 1px solid #ccc;
    }

    td {
      padding: 7px 12px;
      border: 1px solid #ddd;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background: #fafafa;
    }

    hr {
      border: none;
      border-top: 1px solid #ccc;
      margin: 20px 0;
    }

    img { max-width: 100%; height: auto; }

    @media print {
      body { padding: 0; }
      @page { margin: 1.5cm 2cm; }
      pre, blockquote, table { break-inside: avoid; }
      h1, h2, h3 { break-after: avoid; }
    }
  </style>
</head>
<body>
  <h1 class="doc-title">${escapeHtml(title)}</h1>
  ${htmlBody}
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    // Fallback: download as HTML if popup blocked
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
