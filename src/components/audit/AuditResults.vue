<template>
  <div class="audit-results">
    <!-- Header -->
    <div class="audit-results__header">
      <strong class="audit-results__title">{{ report.title }}</strong>
      <span class="audit-results__steps">{{ report.stepCount }} steps</span>
    </div>

    <!-- All clear -->
    <div v-if="isAllClear" class="audit-results__clear">
      <strong>All clear!</strong> No issues found in this playbook.
    </div>

    <!-- Errors -->
    <div v-if="report.errors.length > 0" class="audit-results__section">
      <h4 class="audit-results__section-heading audit-results__section-heading--error">
        ERRORS ({{ report.errors.length }})
      </h4>
      <AuditIssueCard
        v-for="(issue, i) in report.errors"
        :key="'e-' + i"
        :issue="issue"
        type="error"
        :playbook-id="report.playbookId"
        @applied="$emit('refresh')"
      />
    </div>

    <!-- Warnings -->
    <div v-if="report.warnings.length > 0" class="audit-results__section">
      <h4 class="audit-results__section-heading audit-results__section-heading--warning">
        WARNINGS ({{ report.warnings.length }})
      </h4>
      <AuditIssueCard
        v-for="(issue, i) in report.warnings"
        :key="'w-' + i"
        :issue="issue"
        type="warning"
        :playbook-id="report.playbookId"
        @applied="$emit('refresh')"
      />
    </div>

    <!-- Suggestions -->
    <div v-if="report.suggestions.length > 0" class="audit-results__section">
      <h4 class="audit-results__section-heading audit-results__section-heading--suggestion">
        SUGGESTIONS ({{ report.suggestions.length }})
      </h4>
      <AuditIssueCard
        v-for="(issue, i) in report.suggestions"
        :key="'s-' + i"
        :issue="issue"
        type="suggestion"
        :playbook-id="report.playbookId"
        @applied="$emit('refresh')"
      />
    </div>

    <!-- Syntax reference -->
    <div class="audit-results__syntax">
      <h4 class="audit-results__syntax-heading">SYNTAX TO FIX COMMON ISSUES</h4>
      <div class="audit-results__syntax-body">
        <div>Add Eddie message:</div>
        <code>:::eddie</code><br>
        <code>Your message here.</code><br>
        <code>:::</code>
        <br><br>
        <div>Add branch to a step:</div>
        <code>- Condition &#8594; Step 3</code>
        <br><br>
        <div>Add resolution:</div>
        <code>- Issue fixed &#8594; &#9989; RESOLVED</code>
        <br><br>
        <div>Add internal note:</div>
        <code>:::internal</code><br>
        <code>Note for agents.</code><br>
        <code>:::</code>
        <br><br>
        <div>Add warning:</div>
        <code>:::warn Important</code><br>
        <code>Warning text.</code><br>
        <code>:::</code>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AuditIssueCard from './AuditIssueCard.vue'

const props = defineProps({
  report: { type: Object, required: true },
})

defineEmits(['refresh'])

const isAllClear = computed(() => {
  return (
    props.report.errors.length === 0 &&
    props.report.warnings.length === 0 &&
    props.report.suggestions.length === 0
  )
})
</script>

<style scoped>
.audit-results__header {
  margin-bottom: 16px;
}

.audit-results__title {
  font-size: 15px;
  color: var(--text-dark, #1a1a1a);
}

.audit-results__steps {
  color: var(--text-muted, #888);
  font-size: 13px;
  margin-left: 8px;
}

.audit-results__clear {
  background: #e6f9f0;
  border-left: 3px solid #0a8;
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 13px;
}

.audit-results__clear strong {
  color: #0a8;
}

.audit-results__section {
  margin-bottom: 16px;
}

.audit-results__section-heading {
  font-size: 13px;
  margin-bottom: 8px;
  font-weight: 600;
}

.audit-results__section-heading--error {
  color: #e53e3e;
}

.audit-results__section-heading--warning {
  color: #b47a1a;
}

.audit-results__section-heading--suggestion {
  color: #0369a1;
}

.audit-results__syntax {
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid var(--card-border, #e0e0e0);
}

.audit-results__syntax-heading {
  font-size: 13px;
  margin-bottom: 8px;
  color: var(--text-muted, #888);
  font-weight: 600;
}

.audit-results__syntax-body {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--text-muted, #888);
  line-height: 1.8;
  background: var(--bg2, #f8f9fa);
  padding: 10px 14px;
  border-radius: 6px;
}

.audit-results__syntax-body code {
  font-size: 11px;
}

.audit-results__syntax-body div {
  font-weight: 600;
  color: var(--text, #333);
  margin-bottom: 2px;
}
</style>
