Eddie.playbooks['b'] = {
  id: 'b',
  title: 'Playbook B — No Internet · Openserve',
  subtitle: 'Temporary escalation flow',
  status: 'soon',
  color: 'var(--amber)',
  group: 'playbooks',
  keywords: ['Openserve', 'no internet', 'fibre'],
  markdown: [
    '---',
    'title: Playbook B — No Internet · Openserve',
    'subtitle: Temporary escalation flow',
    'status: soon',
    '---',
    '',
    '## Step 1: Escalate to Human Agent',
    '',
    ':::internal Temporary procedure',
    'All Openserve cases are currently escalated directly to a human agent. Full diagnostic flow coming soon.',
    ':::',
    '',
    ':::eddie',
    "I'm going to connect you with one of our support team members who specialises in Openserve connections. They'll be able to help you from here — hang tight!",
    ':::',
    '',
    '{amber|Escalate-OpenFibre}'
  ].join('\n')
};
