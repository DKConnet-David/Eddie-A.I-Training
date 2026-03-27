// Playbook auditor — analyses a playbook for missing steps, contradictions, and improvements

Eddie.playbookAudit = {

  // Run a full audit on a playbook by ID, returns an audit report object
  audit: function(id) {
    var pb = Eddie.playbooks[id];
    if (!pb) return null;

    var overrides = Eddie.storage.getPlaybookOverrides();
    var md = (overrides[id] && overrides[id].markdown) ? overrides[id].markdown : pb.markdown;
    var parts = Eddie.markdown.splitMarkdownSteps(md);

    var report = {
      playbookId: id,
      title: pb.title,
      stepCount: parts.steps.length,
      errors: [],    // Critical issues
      warnings: [],  // Potential problems
      suggestions: [] // Improvements
    };

    if (parts.steps.length === 0) {
      report.errors.push({ type: 'empty', message: 'This playbook has no steps defined.' });
      return report;
    }

    // Build step map: number → step data
    var stepMap = {};
    var stepNumbers = [];
    for (var i = 0; i < parts.steps.length; i++) {
      var s = parts.steps[i];
      stepMap[s.number.toUpperCase()] = { index: i, title: s.title, markdown: s.markdown, number: s.number };
      stepNumbers.push(s.number.toUpperCase());
    }

    // Check for duplicate step numbers
    var seen = {};
    for (var j = 0; j < stepNumbers.length; j++) {
      var num = stepNumbers[j];
      if (seen[num]) {
        report.errors.push({
          type: 'duplicate',
          step: num,
          message: 'Duplicate step number: Step ' + num + ' appears more than once.'
        });
      }
      seen[num] = true;
    }

    // Parse all branch references from each step
    var allRefs = {};   // stepNum → [referenced destinations]
    var referencedSteps = {};  // all step numbers that are referenced as destinations

    for (var k = 0; k < parts.steps.length; k++) {
      var step = parts.steps[k];
      var refs = this.extractReferences(step.markdown);
      allRefs[step.number.toUpperCase()] = refs;

      for (var r = 0; r < refs.length; r++) {
        var ref = refs[r];
        if (ref.type === 'step') {
          referencedSteps[ref.target.toUpperCase()] = true;
        }
      }
    }

    // Check for missing step references
    var missingSteps = {};
    Object.keys(referencedSteps).forEach(function(ref) {
      if (!stepMap[ref]) {
        missingSteps[ref] = true;
      }
    });
    Object.keys(missingSteps).forEach(function(ref) {
      report.errors.push({
        type: 'missing_step',
        step: ref,
        message: 'Step ' + ref + ' is referenced but does not exist in this playbook.'
      });
    });

    // Check for dead-end steps (no branches, no RESOLVED, not the last step)
    for (var m = 0; m < parts.steps.length; m++) {
      var deadStep = parts.steps[m];
      var deadRefs = allRefs[deadStep.number.toUpperCase()] || [];
      var hasResolved = deadStep.markdown.indexOf('RESOLVED') > -1;
      var hasEscalate = /escalate/i.test(deadStep.markdown) || /escalate/i.test(deadStep.title);
      var hasRouteLink = /\[\[\w+\|/.test(deadStep.markdown);
      var hasBranch = deadRefs.some(function(r) { return r.type === 'step' || r.type === 'resolved'; });

      if (!hasBranch && !hasResolved && !hasEscalate && !hasRouteLink) {
        report.warnings.push({
          type: 'dead_end',
          step: deadStep.number,
          message: 'Step ' + deadStep.number + ' ("' + deadStep.title + '") has no branches, resolution, or escalation — it may be a dead end.'
        });
      }
    }

    // Check for unreachable steps (not referenced by any other step, and not step 1)
    for (var n = 0; n < parts.steps.length; n++) {
      var uStep = parts.steps[n];
      var uNum = uStep.number.toUpperCase();
      if (uNum === '1') continue; // Step 1 is always the entry point

      if (!referencedSteps[uNum]) {
        report.warnings.push({
          type: 'unreachable',
          step: uStep.number,
          message: 'Step ' + uStep.number + ' ("' + uStep.title + '") is never referenced by any other step — it may be unreachable.'
        });
      }
    }

    // Check for steps without an Eddie says block
    for (var p = 0; p < parts.steps.length; p++) {
      var eStep = parts.steps[p];
      if (eStep.markdown.indexOf(':::eddie') === -1) {
        report.suggestions.push({
          type: 'no_eddie_block',
          step: eStep.number,
          message: 'Step ' + eStep.number + ' ("' + eStep.title + '") has no :::eddie block — consider adding what Eddie should say to the customer.'
        });
      }
    }

    // Check for steps without internal notes
    for (var q = 0; q < parts.steps.length; q++) {
      var iStep = parts.steps[q];
      if (iStep.markdown.indexOf(':::internal') === -1 && iStep.markdown.indexOf(':::warn') === -1) {
        report.suggestions.push({
          type: 'no_internal',
          step: iStep.number,
          message: 'Step ' + iStep.number + ' ("' + iStep.title + '") has no :::internal or :::warn block — consider adding internal notes or warnings for agents.'
        });
      }
    }

    // Check sub-step consistency (e.g., 2A exists but no step 2)
    for (var s2 = 0; s2 < parts.steps.length; s2++) {
      var subStep = parts.steps[s2];
      var subMatch = subStep.number.match(/^(\d+)[A-Za-z]/);
      if (subMatch) {
        var parentNum = subMatch[1];
        if (!stepMap[parentNum]) {
          report.warnings.push({
            type: 'orphan_substep',
            step: subStep.number,
            message: 'Sub-step ' + subStep.number + ' exists but parent Step ' + parentNum + ' is missing.'
          });
        }
      }
    }

    // Check for contradicting escalation tags (multiple different tags)
    var tags = [];
    for (var t = 0; t < parts.steps.length; t++) {
      var tagMatches = parts.steps[t].markdown.match(/\{red\|([^}]+)\}/g);
      if (tagMatches) {
        tagMatches.forEach(function(tm) {
          var val = tm.replace(/\{red\|/, '').replace(/\}/, '');
          if (tags.indexOf(val) === -1) tags.push(val);
        });
      }
    }

    return report;
  },

  // Extract step references and resolved markers from step markdown
  extractReferences: function(markdown) {
    var refs = [];
    var lines = markdown.split('\n');

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      // Branch rows: - Condition → Step X or - Condition → RESOLVED
      var branchMatch = line.match(/→\s*(.+)/);
      if (branchMatch) {
        var dest = branchMatch[1].trim();
        if (dest.indexOf('RESOLVED') > -1) {
          refs.push({ type: 'resolved', target: 'RESOLVED' });
        } else {
          // Extract step number from "Step 3A" or "Step 5 (escalate)" etc.
          var stepRef = dest.match(/Step\s+(\w+)/i);
          if (stepRef) {
            refs.push({ type: 'step', target: stepRef[1] });
          }
        }
      }
    }

    return refs;
  },

  // Format the audit report as readable HTML
  formatReport: function(report) {
    if (!report) return '<p>Could not analyse this playbook.</p>';

    var html = '';
    html += '<div style="margin-bottom:16px;">';
    html += '<strong style="font-size:15px;">' + report.title + '</strong>';
    html += '<span style="color:var(--text-muted);font-size:13px;margin-left:8px;">' + report.stepCount + ' steps</span>';
    html += '</div>';

    // Summary
    var errorCount = report.errors.length;
    var warnCount = report.warnings.length;
    var sugCount = report.suggestions.length;

    if (errorCount === 0 && warnCount === 0 && sugCount === 0) {
      html += '<div style="background:#e6f9f0;border-left:3px solid #0a8;padding:10px 14px;border-radius:6px;margin-bottom:12px;">';
      html += '<strong style="color:#0a8;">All clear!</strong> No issues found in this playbook.';
      html += '</div>';
      return html;
    }

    // Errors
    if (errorCount > 0) {
      html += '<div style="margin-bottom:16px;">';
      html += '<h4 style="color:#e53e3e;font-size:13px;margin-bottom:8px;">ERRORS (' + errorCount + ')</h4>';
      report.errors.forEach(function(e) {
        html += '<div style="background:#fef2f2;border-left:3px solid #e53e3e;padding:8px 12px;border-radius:4px;margin-bottom:6px;font-size:13px;">';
        html += e.message;
        html += '</div>';
      });
      html += '</div>';
    }

    // Warnings
    if (warnCount > 0) {
      html += '<div style="margin-bottom:16px;">';
      html += '<h4 style="color:#b47a1a;font-size:13px;margin-bottom:8px;">WARNINGS (' + warnCount + ')</h4>';
      report.warnings.forEach(function(w) {
        html += '<div style="background:#fef3e0;border-left:3px solid #b47a1a;padding:8px 12px;border-radius:4px;margin-bottom:6px;font-size:13px;">';
        html += w.message;
        html += '</div>';
      });
      html += '</div>';
    }

    // Suggestions
    if (sugCount > 0) {
      html += '<div style="margin-bottom:16px;">';
      html += '<h4 style="color:#0369a1;font-size:13px;margin-bottom:8px;">SUGGESTIONS (' + sugCount + ')</h4>';
      report.suggestions.forEach(function(s) {
        html += '<div style="background:#ebf5fb;border-left:3px solid #0369a1;padding:8px 12px;border-radius:4px;margin-bottom:6px;font-size:13px;">';
        html += s.message;
        html += '</div>';
      });
      html += '</div>';
    }

    // Syntax quick reference
    html += '<div style="margin-top:20px;padding-top:14px;border-top:1px solid var(--card-border,#e0e0e0);">';
    html += '<h4 style="font-size:13px;margin-bottom:8px;color:var(--text-muted);">SYNTAX TO FIX COMMON ISSUES</h4>';
    html += '<div style="font-family:monospace;font-size:11px;color:var(--text-muted);line-height:1.8;background:var(--bg2,#f8f9fa);padding:10px 14px;border-radius:6px;">';
    html += 'Add Eddie message:<br><code>:::eddie</code><br><code>Your message here.</code><br><code>:::</code><br><br>';
    html += 'Add branch to a step:<br><code>- Condition → Step 3</code><br><br>';
    html += 'Add resolution:<br><code>- Issue fixed → ✅ RESOLVED</code><br><br>';
    html += 'Add internal note:<br><code>:::internal</code><br><code>Note for agents.</code><br><code>:::</code><br><br>';
    html += 'Add warning:<br><code>:::warn Important</code><br><code>Warning text.</code><br><code>:::</code>';
    html += '</div></div>';

    return html;
  },

  // Run audit and display in a panel
  showAuditForPlaybook: function(id) {
    var report = this.audit(id);
    var html = this.formatReport(report);
    return html;
  }
};
