// Markdown parser with custom block syntax for playbooks
//
// Syntax reference:
//   ## Step 1: Title          → step card (first is open)
//   ## Step 3A: Title         → sub-step card
//   ### Heading               → h3 inside content
//
//   :::eddie                  → green-bordered "Eddie says" block
//   Content here
//   :::
//
//   :::internal               → gray-bordered internal note block
//   :::internal Custom Label  → with custom label
//   Content here
//   :::
//
//   :::warn                   → red warn block (NEVER rules)
//   :::warn Custom Label
//   Content here
//   :::
//
//   :::ok                     → green ok block (resolution)
//   :::ok Custom Label
//   Content here
//   :::
//
//   - Condition → Destination   → branch row
//   - Condition → ✅ RESOLVED   → resolved branch
//   - Condition → [[a|Playbook A]] → branch with route link
//
//   [[a|Playbook A]]           → route link to playbook 'a'
//   {green|Fibre-LOS}          → colored tag pill
//   **bold**  *italic*         → standard inline
//   | col | col |              → table rows
//
//   Frontmatter between --- markers for metadata

Eddie.markdown = {

  // ── Main render: markdown string → full playbook HTML ──
  render: function(text, meta) {
    meta = meta || {};
    var fm = this.extractFrontmatter(text);
    var body = fm.body;
    var data = Object.assign({}, fm.data, meta);

    var html = '';

    // Build header from metadata
    html += this.renderHeader(data);

    // Split into step sections and pre-step content
    var sections = this.splitSteps(body);

    // Render pre-step content (before any ## Step)
    if (sections.pre) {
      html += this.renderContent(sections.pre);
    }

    // Render each step as a card
    for (var i = 0; i < sections.steps.length; i++) {
      var step = sections.steps[i];
      var isFirst = (i === 0);
      html += this.renderStepCard(step.number, step.title, step.body, isFirst, i, sections.steps.length);
    }

    return html;
  },

  // ── Frontmatter ──
  extractFrontmatter: function(text) {
    var data = {};
    var body = text;

    if (text.trimStart().startsWith('---')) {
      var trimmed = text.trimStart();
      var end = trimmed.indexOf('---', 3);
      if (end > -1) {
        var fmBlock = trimmed.substring(3, end).trim();
        body = trimmed.substring(end + 3).trim();

        fmBlock.split('\n').forEach(function(line) {
          var idx = line.indexOf(':');
          if (idx > -1) {
            var key = line.substring(0, idx).trim();
            var val = line.substring(idx + 1).trim();
            data[key] = val;
          }
        });
      }
    }

    return { data: data, body: body };
  },

  // ── Header from metadata ──
  renderHeader: function(data) {
    if (!data.title) return '';

    var html = '<div class="playbook-header">';
    html += '<h2 class="playbook-title">' + this.escHtml(data.title) + '</h2>';

    if (data.subtitle) {
      html += '<div class="playbook-subtitle">' + this.escHtml(data.subtitle) + '</div>';
    }

    if (data.status === 'active') {
      html += '<span class="status-pill active-pill"><span class="pill-dot"></span> Active</span>';
    } else if (data.status === 'soon') {
      html += '<span class="status-pill soon-pill"><span class="pill-dot"></span> Coming Soon</span>';
    }

    if (data.keywords) {
      html += '<div class="keywords-bar">';
      data.keywords.split(',').forEach(function(kw) {
        kw = kw.trim();
        if (kw) html += '<span class="tag tag-blue">' + Eddie.markdown.escHtml(kw) + '</span>';
      });
      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  // ── Split text into pre-step content and step sections ──
  splitSteps: function(text) {
    var lines = text.split('\n');
    var pre = [];
    var steps = [];
    var current = null;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var stepMatch = line.match(/^##\s+Step\s+(\w+):\s*(.+)/);

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

    return { pre: pre.join('\n').trim(), steps: steps };
  },

  // ── Step card HTML ──
  renderStepCard: function(number, title, body, isFirst, stepIndex, totalSteps) {
    var openClass = isFirst ? ' open' : '';
    var idx = (typeof stepIndex === 'number') ? stepIndex : -1;
    var html = '<div class="step-card' + openClass + '" data-step-index="' + idx + '">';
    html += '<div class="step-header" onclick="Eddie.ui.toggleStep(this)">';
    html += '<span class="step-drag-handle" title="Drag to reorder">&#9776;</span>';
    html += '<span class="step-number">' + this.escHtml(number) + '</span>';
    html += '<span class="step-title">' + this.escHtml(title) + '</span>';
    html += '<span class="step-chevron">▼</span>';
    html += '</div>';
    html += '<div class="step-body">';
    html += this.renderContent(body.trim());
    html += '</div></div>';
    return html;
  },

  // ── Render a block of mixed content ──
  renderContent: function(text) {
    if (!text) return '';

    var html = '';
    var lines = text.split('\n');
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      // ─ Fenced block: :::type [label]
      var blockMatch = line.match(/^:::(eddie|internal|warn|ok)\s*(.*)/);
      if (blockMatch) {
        var type = blockMatch[1];
        var label = blockMatch[2].trim();
        var blockLines = [];
        i++;
        while (i < lines.length && lines[i].trim() !== ':::') {
          blockLines.push(lines[i]);
          i++;
        }
        i++; // skip closing :::
        html += this.renderBlock(type, label, blockLines.join('\n').trim());
        continue;
      }

      // ─ Branch rows: consecutive lines matching "- text → text"
      if (line.match(/^\s*-\s+.+→.+/)) {
        var branchLines = [];
        while (i < lines.length && lines[i].match(/^\s*-\s+.+→.+/)) {
          branchLines.push(lines[i]);
          i++;
        }
        html += this.renderBranches(branchLines);
        continue;
      }

      // ─ Table: lines starting with |
      if (line.trim().startsWith('|')) {
        var tableLines = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          tableLines.push(lines[i]);
          i++;
        }
        html += this.renderTable(tableLines);
        continue;
      }

      // ─ h3 heading
      if (line.match(/^###\s+/)) {
        html += '<h3 style="margin:20px 0 12px;font-size:15px;">' + this.parseInline(line.replace(/^###\s+/, '')) + '</h3>';
        i++;
        continue;
      }

      // ─ h4 heading (used for sub-sections in non-step areas)
      if (line.match(/^####\s+/)) {
        html += '<h4 style="margin:16px 0 8px;font-size:14px;color:var(--text-muted);">' + this.parseInline(line.replace(/^####\s+/, '')) + '</h4>';
        i++;
        continue;
      }

      // ─ Empty line
      if (line.trim() === '') {
        i++;
        continue;
      }

      // ─ Regular paragraph (collect consecutive non-special lines)
      var paraLines = [];
      while (i < lines.length &&
             lines[i].trim() !== '' &&
             !lines[i].match(/^:::(eddie|internal|warn|ok)/) &&
             !lines[i].match(/^\s*-\s+.+→.+/) &&
             !lines[i].trim().startsWith('|') &&
             !lines[i].match(/^##/) &&
             lines[i].trim() !== ':::') {
        paraLines.push(lines[i]);
        i++;
      }
      if (paraLines.length > 0) {
        html += '<p style="font-size:13.5px;color:var(--text-muted);margin:8px 0;line-height:1.55;">' +
          this.parseInline(paraLines.join('\n')) + '</p>';
      }
    }

    return html;
  },

  // ── Render a custom block ──
  renderBlock: function(type, label, content) {
    var defaults = {
      eddie: { cls: 'msg-block', labelCls: 'msg-block-label', defaultLabel: 'Eddie says' },
      internal: { cls: 'internal-block', labelCls: 'internal-block-label', defaultLabel: 'Internal note' },
      warn: { cls: 'warn-block', labelCls: 'warn-block-label', defaultLabel: 'Never' },
      ok: { cls: 'ok-block', labelCls: 'ok-block-label', defaultLabel: 'Resolution' }
    };

    var cfg = defaults[type] || defaults.internal;
    var displayLabel = label || cfg.defaultLabel;

    var html = '<div class="' + cfg.cls + '">';
    html += '<div class="' + cfg.labelCls + '">' + this.escHtml(displayLabel) + '</div>';
    html += this.renderBlockContent(content);
    html += '</div>';
    return html;
  },

  // ── Render content inside a block (supports line breaks and inline markdown) ──
  renderBlockContent: function(text) {
    var paras = text.split(/\n\n+/);
    var html = '';
    for (var i = 0; i < paras.length; i++) {
      var p = paras[i].trim();
      if (!p) continue;
      html += '<p>' + this.parseInline(p) + '</p>';
    }
    return html;
  },

  // ── Branches ──
  renderBranches: function(lines) {
    var html = '<div class="branches">';
    for (var i = 0; i < lines.length; i++) {
      var match = lines[i].match(/^\s*-\s+(.+?)\s*→\s*(.+)/);
      if (match) {
        var cond = match[1].trim();
        var dest = match[2].trim();

        html += '<div class="branch-row">';
        html += '<span class="branch-condition">' + this.parseInline(cond) + '</span>';
        html += '<span class="branch-arrow">→</span>';

        // Check for resolved marker
        if (dest.indexOf('RESOLVED') > -1) {
          html += '<span class="branch-dest ok-block" style="border:none;padding:2px 8px;display:inline">RESOLVED</span>';
        } else {
          html += '<span class="branch-dest">' + this.parseInline(dest) + '</span>';
        }

        html += '</div>';
      }
    }
    html += '</div>';
    return html;
  },

  // ── Table ──
  renderTable: function(lines) {
    if (lines.length < 2) return '';

    var html = '<table class="routing-table">';

    // Header row
    var headers = this.parseTableRow(lines[0]);
    html += '<thead><tr>';
    for (var h = 0; h < headers.length; h++) {
      html += '<th>' + this.parseInline(headers[h]) + '</th>';
    }
    html += '</tr></thead>';

    // Skip separator row (line with dashes)
    var startRow = 1;
    if (lines.length > 1 && lines[1].match(/^\s*\|[\s\-:|]+\|/)) {
      startRow = 2;
    }

    // Body rows
    html += '<tbody>';
    for (var r = startRow; r < lines.length; r++) {
      var cells = this.parseTableRow(lines[r]);
      html += '<tr>';
      for (var c = 0; c < cells.length; c++) {
        html += '<td>' + this.parseInline(cells[c]) + '</td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  },

  parseTableRow: function(line) {
    return line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(function(cell) {
      return cell.trim();
    });
  },

  // ── Inline markdown parsing ──
  parseInline: function(text) {
    var s = text;

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
  },

  // ── Escape HTML ──
  escHtml: function(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  // ── Split full markdown into frontmatter, pre-step content, and individual step chunks ──
  splitMarkdownSteps: function(fullMd) {
    var fm = this.extractFrontmatter(fullMd);
    var sections = this.splitSteps(fm.body);

    // Rebuild the frontmatter string
    var fmStr = '';
    if (Object.keys(fm.data).length > 0) {
      fmStr = '---\n';
      Object.keys(fm.data).forEach(function(k) {
        fmStr += k + ': ' + fm.data[k] + '\n';
      });
      fmStr += '---';
    }

    var steps = sections.steps.map(function(s) {
      return {
        number: s.number,
        title: s.title,
        markdown: s.body.trim()
      };
    });

    return {
      frontmatter: fmStr,
      pre: sections.pre,
      steps: steps
    };
  },

  // ── Reassemble full markdown from parts ──
  joinMarkdownSteps: function(parts) {
    var lines = [];

    if (parts.frontmatter) {
      lines.push(parts.frontmatter);
      lines.push('');
    }

    if (parts.pre) {
      lines.push(parts.pre);
      lines.push('');
    }

    parts.steps.forEach(function(s) {
      lines.push('## Step ' + s.number + ': ' + s.title);
      lines.push('');
      if (s.markdown) {
        lines.push(s.markdown);
        lines.push('');
      }
    });

    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }
};
