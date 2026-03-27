// Markdown parser with custom block syntax for playbooks
//
// Syntax reference:
//   ## Step 1: Title          -> step card (first is open)
//   ## Step 3A: Title         -> sub-step card
//   ### Heading               -> h3 inside content
//
//   :::eddie                  -> green-bordered "Eddie says" block
//   Content here
//   :::
//
//   :::internal               -> gray-bordered internal note block
//   :::internal Custom Label  -> with custom label
//   Content here
//   :::
//
//   :::warn                   -> red warn block (NEVER rules)
//   :::warn Custom Label
//   Content here
//   :::
//
//   :::ok                     -> green ok block (resolution)
//   :::ok Custom Label
//   Content here
//   :::
//
//   - Condition -> Destination   -> branch row
//   - Condition -> RESOLVED      -> resolved branch
//   - Condition -> [[a|Playbook A]] -> branch with route link
//
//   [[a|Playbook A]]           -> route link to playbook 'a'
//   {green|Fibre-LOS}          -> colored tag pill
//   **bold**  *italic*         -> standard inline
//   | col | col |              -> table rows
//
//   Frontmatter between --- markers for metadata

// -- Main render: markdown string -> full playbook HTML --
export function render(text, meta) {
  meta = meta || {};
  const fm = extractFrontmatter(text);
  const body = fm.body;
  const data = Object.assign({}, fm.data, meta);

  let html = '';

  // Build header from metadata
  html += renderHeader(data);

  // Split into step sections and pre-step content
  const sections = splitSteps(body);

  // Render pre-step content (before any ## Step)
  if (sections.pre) {
    html += renderContent(sections.pre);
  }

  // Render each step as a card, grouping sub-steps
  let inSubGroup = false;
  for (let i = 0; i < sections.steps.length; i++) {
    const step = sections.steps[i];
    const isFirst = (i === 0);
    const isSub = /^\d+[A-Za-z]/.test(step.number);
    const nextStep = sections.steps[i + 1];
    const nextIsSub = nextStep && /^\d+[A-Za-z]/.test(nextStep.number);

    // Open sub-step group wrapper
    if (isSub && !inSubGroup) {
      html += '<div class="sub-step-group">';
      html += '<div class="sub-step-connector"></div>';
      html += '<div class="sub-step-cards">';
      inSubGroup = true;
    }

    html += renderStepCard(step.number, step.title, step.body, isFirst, i, sections.steps.length);

    // Close sub-step group wrapper
    if (inSubGroup && !nextIsSub) {
      html += '</div></div>';
      inSubGroup = false;
    }
  }
  if (inSubGroup) {
    html += '</div></div>';
  }

  return html;
}

// -- Frontmatter --
export function extractFrontmatter(text) {
  const data = {};
  let body = text;

  if (text.trimStart().startsWith('---')) {
    const trimmed = text.trimStart();
    const end = trimmed.indexOf('---', 3);
    if (end > -1) {
      const fmBlock = trimmed.substring(3, end).trim();
      body = trimmed.substring(end + 3).trim();

      fmBlock.split('\n').forEach(function (line) {
        const idx = line.indexOf(':');
        if (idx > -1) {
          const key = line.substring(0, idx).trim();
          const val = line.substring(idx + 1).trim();
          data[key] = val;
        }
      });
    }
  }

  return { data, body };
}

// -- Header from metadata --
export function renderHeader(data) {
  if (!data.title) return '';

  let html = '<div class="playbook-header">';
  html += '<h2 class="playbook-title">' + escHtml(data.title) + '</h2>';

  if (data.subtitle) {
    html += '<div class="playbook-subtitle">' + escHtml(data.subtitle) + '</div>';
  }

  if (data.status === 'active') {
    html += '<span class="status-pill active-pill"><span class="pill-dot"></span> Active</span>';
  } else if (data.status === 'soon') {
    html += '<span class="status-pill soon-pill"><span class="pill-dot"></span> Coming Soon</span>';
  }

  if (data.keywords) {
    html += '<div class="keywords-bar">';
    data.keywords.split(',').forEach(function (kw) {
      kw = kw.trim();
      if (kw) html += '<span class="tag tag-blue">' + escHtml(kw) + '</span>';
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
}

// -- Split text into pre-step content and step sections --
export function splitSteps(text) {
  const lines = text.split('\n');
  const pre = [];
  const steps = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const stepMatch = line.match(/^##\s+Step\s+(\w+):\s*(.+)/);

    if (stepMatch) {
      if (current) steps.push(current);
      current = { number: stepMatch[1], title: stepMatch[2].trim(), body: '' };
    } else if (current) {
      current.body += line + '\n';
    } else {
      pre.push(line);
    }
  }

  if (current) steps.push(current);

  return { pre: pre.join('\n').trim(), steps };
}

// -- Step card HTML (no onclick attributes -- Vue components handle interaction) --
export function renderStepCard(number, title, body, isFirst, stepIndex, totalSteps) {
  const openClass = isFirst ? ' open' : '';
  const idx = (typeof stepIndex === 'number') ? stepIndex : -1;
  let html = '<div class="step-card' + openClass + '" data-step-index="' + idx + '">';
  html += '<div class="step-header">';
  html += '<span class="step-drag-handle" title="Drag to reorder">&#9776;</span>';
  html += '<span class="step-number">' + escHtml(number) + '</span>';
  html += '<span class="step-title">' + escHtml(title) + '</span>';
  html += '<span class="step-edit-btn" title="Edit step">&#9998;</span>';
  html += '<span class="step-chevron" title="Expand / Collapse">\u25BC</span>';
  html += '</div>';
  html += '<div class="step-body">';
  html += renderContent(body.trim());
  html += '</div></div>';
  return html;
}

// -- Render a block of mixed content --
export function renderContent(text) {
  if (!text) return '';

  let html = '';
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced block: :::type [label]
    const blockMatch = line.match(/^:::(eddie|internal|warn|ok)\s*(.*)/);
    if (blockMatch) {
      const type = blockMatch[1];
      const label = blockMatch[2].trim();
      const blockLines = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::') {
        blockLines.push(lines[i]);
        i++;
      }
      i++; // skip closing :::
      html += renderBlock(type, label, blockLines.join('\n').trim());
      continue;
    }

    // Branch rows: consecutive lines matching "- text -> text"
    if (line.match(/^\s*-\s+.+\u2192.+/)) {
      const branchLines = [];
      while (i < lines.length && lines[i].match(/^\s*-\s+.+\u2192.+/)) {
        branchLines.push(lines[i]);
        i++;
      }
      html += renderBranches(branchLines);
      continue;
    }

    // Table: lines starting with |
    if (line.trim().startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      html += renderTable(tableLines);
      continue;
    }

    // h3 heading
    if (line.match(/^###\s+/)) {
      html += '<h3 style="margin:20px 0 12px;font-size:15px;">' + parseInline(line.replace(/^###\s+/, '')) + '</h3>';
      i++;
      continue;
    }

    // h4 heading
    if (line.match(/^####\s+/)) {
      html += '<h4 style="margin:16px 0 8px;font-size:14px;color:var(--text-muted);">' + parseInline(line.replace(/^####\s+/, '')) + '</h4>';
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Regular paragraph (collect consecutive non-special lines)
    const paraLines = [];
    while (i < lines.length &&
           lines[i].trim() !== '' &&
           !lines[i].match(/^:::(eddie|internal|warn|ok)/) &&
           !lines[i].match(/^\s*-\s+.+\u2192.+/) &&
           !lines[i].trim().startsWith('|') &&
           !lines[i].match(/^##/) &&
           lines[i].trim() !== ':::') {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      html += '<p style="font-size:13.5px;color:var(--text-muted);margin:8px 0;line-height:1.55;">' +
        parseInline(paraLines.join('\n')) + '</p>';
    }
  }

  return html;
}

// -- Render a custom block --
export function renderBlock(type, label, content) {
  const defaults = {
    eddie: { cls: 'msg-block', labelCls: 'msg-block-label', defaultLabel: 'Eddie says' },
    internal: { cls: 'internal-block', labelCls: 'internal-block-label', defaultLabel: 'Internal note' },
    warn: { cls: 'warn-block', labelCls: 'warn-block-label', defaultLabel: 'Never' },
    ok: { cls: 'ok-block', labelCls: 'ok-block-label', defaultLabel: 'Resolution' }
  };

  const cfg = defaults[type] || defaults.internal;
  const displayLabel = label || cfg.defaultLabel;

  let html = '<div class="' + cfg.cls + '">';
  html += '<div class="' + cfg.labelCls + '">' + escHtml(displayLabel) + '</div>';
  html += renderBlockContent(content);
  html += '</div>';
  return html;
}

// -- Render content inside a block (supports line breaks and inline markdown) --
export function renderBlockContent(text) {
  const paras = text.split(/\n\n+/);
  let html = '';
  for (let i = 0; i < paras.length; i++) {
    const p = paras[i].trim();
    if (!p) continue;
    html += '<p>' + parseInline(p) + '</p>';
  }
  return html;
}

// -- Branches --
export function renderBranches(lines) {
  let html = '<div class="branches">';
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^\s*-\s+(.+?)\s*\u2192\s*(.+)/);
    if (match) {
      const cond = match[1].trim();
      const dest = match[2].trim();

      html += '<div class="branch-row">';
      html += '<span class="branch-condition">' + parseInline(cond) + '</span>';
      html += '<span class="branch-arrow">\u2192</span>';

      // Check for resolved marker
      if (dest.indexOf('RESOLVED') > -1) {
        html += '<span class="branch-dest ok-block" style="border:none;padding:2px 8px;display:inline">RESOLVED</span>';
      } else {
        html += '<span class="branch-dest">' + parseInline(dest) + '</span>';
      }

      html += '</div>';
    }
  }
  html += '</div>';
  return html;
}

// -- Table --
export function renderTable(lines) {
  if (lines.length < 2) return '';

  let html = '<table class="routing-table">';

  // Header row
  const headers = parseTableRow(lines[0]);
  html += '<thead><tr>';
  for (let h = 0; h < headers.length; h++) {
    html += '<th>' + parseInline(headers[h]) + '</th>';
  }
  html += '</tr></thead>';

  // Skip separator row (line with dashes)
  let startRow = 1;
  if (lines.length > 1 && lines[1].match(/^\s*\|[\s\-:|]+\|/)) {
    startRow = 2;
  }

  // Body rows
  html += '<tbody>';
  for (let r = startRow; r < lines.length; r++) {
    const cells = parseTableRow(lines[r]);
    html += '<tr>';
    for (let c = 0; c < cells.length; c++) {
      html += '<td>' + parseInline(cells[c]) + '</td>';
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  return html;
}

export function parseTableRow(line) {
  return line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(function (cell) {
    return cell.trim();
  });
}

// -- Inline markdown parsing --
export function parseInline(text) {
  let s = text;

  // Escape HTML (but preserve intentional line breaks)
  s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Route links: [[id|text]]
  s = s.replace(/\[\[(\w+)\|([^\]]+)\]\]/g, '<span class="route-link" data-route="$1">$2</span>');

  // Tags: {color|text}
  s = s.replace(/\{(green|amber|red|blue)\|([^}]+)\}/g, '<span class="tag tag-$1">$2</span>');

  // Bold
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Inline code
  s = s.replace(/`([^`]+)`/g, '<code style="background:var(--row-alt);padding:1px 5px;border-radius:4px;font-family:var(--font-mono);font-size:12px;border:1px solid var(--card-border)">$1</code>');

  // Line breaks within a paragraph
  s = s.replace(/\n/g, '<br>');

  return s;
}

// -- Escape HTML --
export function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// -- Split full markdown into frontmatter, pre-step content, and individual step chunks --
export function splitMarkdownSteps(fullMd) {
  const fm = extractFrontmatter(fullMd);
  const sections = splitSteps(fm.body);

  // Rebuild the frontmatter string
  let fmStr = '';
  if (Object.keys(fm.data).length > 0) {
    fmStr = '---\n';
    Object.keys(fm.data).forEach(function (k) {
      fmStr += k + ': ' + fm.data[k] + '\n';
    });
    fmStr += '---';
  }

  const steps = sections.steps.map(function (s) {
    return {
      number: s.number,
      title: s.title,
      markdown: s.body.trim()
    };
  });

  return {
    frontmatter: fmStr,
    pre: sections.pre,
    steps
  };
}

// -- Reassemble full markdown from parts --
export function joinMarkdownSteps(parts) {
  const lines = [];

  if (parts.frontmatter) {
    lines.push(parts.frontmatter);
    lines.push('');
  }

  if (parts.pre) {
    lines.push(parts.pre);
    lines.push('');
  }

  parts.steps.forEach(function (s) {
    lines.push('## Step ' + s.number + ': ' + s.title);
    lines.push('');
    if (s.markdown) {
      lines.push(s.markdown);
      lines.push('');
    }
  });

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
