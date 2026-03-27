// Playbook auditor -- analyses a playbook for missing steps, contradictions, and improvements

import { splitMarkdownSteps } from './markdown.js';

/**
 * Run a full audit on a playbook, returns an audit report object.
 *
 * @param {object} playbook - The playbook object (id, title, markdown, etc.)
 * @param {string} [markdownOverride] - Optional overridden markdown string (from user edits)
 * @returns {object|null} Audit report with errors, warnings, and suggestions
 */
export function audit(playbook, markdownOverride) {
  if (!playbook) return null;

  const md = markdownOverride || playbook.markdown;
  const parts = splitMarkdownSteps(md);

  const report = {
    playbookId: playbook.id,
    title: playbook.title,
    stepCount: parts.steps.length,
    errors: [],      // Critical issues
    warnings: [],    // Potential problems
    suggestions: []  // Improvements
  };

  if (parts.steps.length === 0) {
    report.errors.push({ type: 'empty', message: 'This playbook has no steps defined.' });
    return report;
  }

  // Build step map: number -> step data
  const stepMap = {};
  const stepNumbers = [];
  for (let i = 0; i < parts.steps.length; i++) {
    const s = parts.steps[i];
    stepMap[s.number.toUpperCase()] = { index: i, title: s.title, markdown: s.markdown, number: s.number };
    stepNumbers.push(s.number.toUpperCase());
  }

  // Check for duplicate step numbers
  const seen = {};
  for (let j = 0; j < stepNumbers.length; j++) {
    const num = stepNumbers[j];
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
  const allRefs = {};          // stepNum -> [referenced destinations]
  const referencedSteps = {};  // all step numbers that are referenced as destinations

  for (let k = 0; k < parts.steps.length; k++) {
    const step = parts.steps[k];
    const refs = extractReferences(step.markdown);
    allRefs[step.number.toUpperCase()] = refs;

    for (let r = 0; r < refs.length; r++) {
      const ref = refs[r];
      if (ref.type === 'step') {
        referencedSteps[ref.target.toUpperCase()] = true;
      }
    }
  }

  // Check for missing step references
  const missingSteps = {};
  Object.keys(referencedSteps).forEach(function (ref) {
    if (!stepMap[ref]) {
      missingSteps[ref] = true;
    }
  });
  Object.keys(missingSteps).forEach(function (ref) {
    report.errors.push({
      type: 'missing_step',
      step: ref,
      message: 'Step ' + ref + ' is referenced but does not exist in this playbook.'
    });
  });

  // Check for dead-end steps (no branches, no RESOLVED, not the last step)
  for (let m = 0; m < parts.steps.length; m++) {
    const deadStep = parts.steps[m];
    const deadRefs = allRefs[deadStep.number.toUpperCase()] || [];
    const hasResolved = deadStep.markdown.indexOf('RESOLVED') > -1;
    const hasEscalate = /escalate/i.test(deadStep.markdown) || /escalate/i.test(deadStep.title);
    const hasRouteLink = /\[\[\w+\|/.test(deadStep.markdown);
    const hasBranch = deadRefs.some(function (r) { return r.type === 'step' || r.type === 'resolved'; });

    if (!hasBranch && !hasResolved && !hasEscalate && !hasRouteLink) {
      report.warnings.push({
        type: 'dead_end',
        step: deadStep.number,
        message: 'Step ' + deadStep.number + ' ("' + deadStep.title + '") has no branches, resolution, or escalation \u2014 it may be a dead end.'
      });
    }
  }

  // Check for unreachable steps (not referenced by any other step, and not step 1)
  for (let n = 0; n < parts.steps.length; n++) {
    const uStep = parts.steps[n];
    const uNum = uStep.number.toUpperCase();
    if (uNum === '1') continue; // Step 1 is always the entry point

    if (!referencedSteps[uNum]) {
      report.warnings.push({
        type: 'unreachable',
        step: uStep.number,
        message: 'Step ' + uStep.number + ' ("' + uStep.title + '") is never referenced by any other step \u2014 it may be unreachable.'
      });
    }
  }

  // Check for steps without an Eddie says block
  for (let p = 0; p < parts.steps.length; p++) {
    const eStep = parts.steps[p];
    if (eStep.markdown.indexOf(':::eddie') === -1) {
      report.suggestions.push({
        type: 'no_eddie_block',
        step: eStep.number,
        message: 'Step ' + eStep.number + ' ("' + eStep.title + '") has no :::eddie block \u2014 consider adding what Eddie should say to the customer.'
      });
    }
  }

  // Check for steps without internal notes
  for (let q = 0; q < parts.steps.length; q++) {
    const iStep = parts.steps[q];
    if (iStep.markdown.indexOf(':::internal') === -1 && iStep.markdown.indexOf(':::warn') === -1) {
      report.suggestions.push({
        type: 'no_internal',
        step: iStep.number,
        message: 'Step ' + iStep.number + ' ("' + iStep.title + '") has no :::internal or :::warn block \u2014 consider adding internal notes or warnings for agents.'
      });
    }
  }

  // Check sub-step consistency (e.g., 2A exists but no step 2)
  for (let s2 = 0; s2 < parts.steps.length; s2++) {
    const subStep = parts.steps[s2];
    const subMatch = subStep.number.match(/^(\d+)[A-Za-z]/);
    if (subMatch) {
      const parentNum = subMatch[1];
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
  const tags = [];
  for (let t = 0; t < parts.steps.length; t++) {
    const tagMatches = parts.steps[t].markdown.match(/\{red\|([^}]+)\}/g);
    if (tagMatches) {
      tagMatches.forEach(function (tm) {
        const val = tm.replace(/\{red\|/, '').replace(/\}/, '');
        if (tags.indexOf(val) === -1) tags.push(val);
      });
    }
  }

  return report;
}

/**
 * Extract step references and resolved markers from step markdown.
 *
 * @param {string} markdown - The markdown content of a single step
 * @returns {Array<{type: string, target: string}>} Array of references found
 */
export function extractReferences(markdown) {
  const refs = [];
  const lines = markdown.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Branch rows: - Condition -> Step X or - Condition -> RESOLVED
    const branchMatch = line.match(/\u2192\s*(.+)/);
    if (branchMatch) {
      const dest = branchMatch[1].trim();
      if (dest.indexOf('RESOLVED') > -1) {
        refs.push({ type: 'resolved', target: 'RESOLVED' });
      } else {
        // Extract step number from "Step 3A" or "Step 5 (escalate)" etc.
        const stepRef = dest.match(/Step\s+(\w+)/i);
        if (stepRef) {
          refs.push({ type: 'step', target: stepRef[1] });
        }
      }
    }
  }

  return refs;
}
