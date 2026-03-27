// Export playbooks as a Word document (.doc via HTML blob)

import { render } from './markdown.js';

/**
 * Build the full document HTML from all playbooks.
 *
 * @param {Record<string, object>} playbooks - All playbooks keyed by ID
 * @param {string[]} playbookOrder - Ordered list of playbook IDs
 * @param {Record<string, object>} overrides - User overrides keyed by playbook ID (may contain markdown, status)
 * @returns {string} HTML content for the document body
 */
export function buildDocument(playbooks, playbookOrder, overrides) {
  overrides = overrides || {};
  let html = '';

  playbookOrder.forEach(function (id) {
    const pb = playbooks[id];
    if (!pb) return;

    // Check override status first, then playbook status
    const status = (overrides[id] && overrides[id].status) ? overrides[id].status : pb.status;
    if (status !== 'active') return;

    const md = (overrides[id] && overrides[id].markdown) ? overrides[id].markdown : pb.markdown;
    if (!md) return;

    const rendered = render(md, {
      title: pb.title,
      subtitle: pb.subtitle,
      status: pb.status,
      keywords: (pb.keywords || []).join(', ')
    });

    html += '<div class="playbook-section">' + rendered + '</div>\n';
    html += '<hr>\n';
  });

  return html;
}

/**
 * Generate and download a .doc file containing all active playbooks.
 *
 * @param {Record<string, object>} playbooks - All playbooks keyed by ID
 * @param {string[]} playbookOrder - Ordered list of playbook IDs
 * @param {Record<string, object>} overrides - User overrides keyed by playbook ID
 */
export function exportWord(playbooks, playbookOrder, overrides) {
  const content = buildDocument(playbooks, playbookOrder, overrides);

  const wordHtml = [
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" ',
    'xmlns:w="urn:schemas-microsoft-com:office:word" ',
    'xmlns="http://www.w3.org/TR/REC-html40">',
    '<head><meta charset="utf-8">',
    '<style>',
    'body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1a1a1a; line-height: 1.6; max-width: 700px; margin: 0 auto; }',
    'h2 { font-size: 16pt; color: #0d0f12; margin-top: 24pt; margin-bottom: 6pt; border-bottom: 1px solid #ddd; padding-bottom: 4pt; }',
    'h3 { font-size: 13pt; color: #333; margin-top: 18pt; margin-bottom: 4pt; }',
    'h4 { font-size: 11pt; color: #555; margin-top: 12pt; }',
    '.playbook-header { margin-bottom: 16pt; }',
    '.playbook-title { font-size: 18pt; color: #0d0f12; margin-bottom: 2pt; }',
    '.playbook-subtitle { font-size: 10pt; color: #666; margin-bottom: 6pt; }',
    '.status-pill { font-size: 9pt; padding: 2px 8px; border-radius: 10px; }',
    '.status-pill.active-pill { background: #e6f9f0; color: #0369a1; }',
    '.status-pill.soon-pill { background: #fef3e0; color: #b47a1a; }',
    '.keywords-bar { margin-top: 6pt; }',
    '.step-card { border: 1px solid #e0e0e0; border-radius: 6px; margin: 10pt 0; padding: 0; page-break-inside: avoid; }',
    '.step-header { background: #f8f8f8; padding: 8pt 12pt; font-weight: bold; }',
    '.step-number { display: inline-block; background: #eee; padding: 2pt 6pt; border-radius: 4px; font-size: 10pt; margin-right: 6pt; }',
    '.step-chevron { display: none; }',
    '.step-body { padding: 8pt 12pt; }',
    '.msg-block { background: #f0f7fb; border-left: 3px solid #008fc9; padding: 8pt 12pt; margin: 8pt 0; }',
    '.msg-block-label { font-size: 8pt; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5pt; margin-bottom: 3pt; font-weight: bold; }',
    '.internal-block { background: #f5f5f5; border-left: 3px solid #999; padding: 8pt 12pt; margin: 8pt 0; }',
    '.internal-block-label { font-size: 8pt; color: #666; text-transform: uppercase; letter-spacing: 0.5pt; margin-bottom: 3pt; font-weight: bold; }',
    '.warn-block { background: #fef2f2; border-left: 3px solid #e53e3e; padding: 8pt 12pt; margin: 8pt 0; }',
    '.warn-block-label { font-size: 8pt; color: #e53e3e; text-transform: uppercase; letter-spacing: 0.5pt; margin-bottom: 3pt; font-weight: bold; }',
    '.ok-block { background: #f0f7fb; border-left: 3px solid #008fc9; padding: 8pt 12pt; margin: 8pt 0; }',
    '.ok-block-label { font-size: 8pt; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5pt; margin-bottom: 3pt; font-weight: bold; }',
    '.branches { margin: 6pt 0; }',
    '.branch-row { margin: 3pt 0; font-size: 10.5pt; }',
    '.branch-condition { color: #555; }',
    '.branch-arrow { color: #999; margin: 0 4pt; }',
    '.branch-dest { color: #0369a1; font-weight: bold; }',
    '.tag { font-size: 8pt; padding: 1pt 6pt; border-radius: 3px; margin-right: 3pt; }',
    '.tag-green { background: #e6f9f0; color: #0369a1; }',
    '.tag-amber { background: #fef3e0; color: #b47a1a; }',
    '.tag-red { background: #fef2f2; color: #c53030; }',
    '.tag-blue { background: #ebf5fb; color: #2b6cb0; }',
    '.route-link { color: #0369a1; font-weight: bold; text-decoration: underline; }',
    '.routing-table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 10.5pt; }',
    '.routing-table th { background: #f0f0f0; text-align: left; padding: 6pt 10pt; border: 1px solid #ddd; font-size: 9pt; text-transform: uppercase; }',
    '.routing-table td { padding: 6pt 10pt; border: 1px solid #ddd; }',
    'hr { border: none; border-top: 1px solid #ccc; margin: 20pt 0; page-break-after: always; }',
    'p { margin: 4pt 0; }',
    '</style></head><body>',
    '<h1 style="font-size:22pt;text-align:center;margin-bottom:4pt;">Eddie AI \u2014 Playbook Reference</h1>',
    '<p style="text-align:center;color:#666;font-size:10pt;margin-bottom:20pt;">Generated ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '</p>',
    '<hr>',
    content,
    '</body></html>'
  ].join('\n');

  const blob = new Blob([wordHtml], { type: 'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'Eddie-AI-Playbooks.doc';
  link.click();
  URL.revokeObjectURL(link.href);
}
