Eddie.playbooks['d'] = {
  id: 'd',
  title: 'Playbook D — Slow Internet',
  subtitle: 'Temporary escalation flow',
  status: 'soon',
  color: 'var(--amber)',
  group: 'playbooks',
  keywords: ['slow', 'speed', 'buffering', 'lag'],
  markdown: [
    '---',
    'title: Playbook D — Slow Internet',
    'subtitle: Temporary escalation flow',
    'status: soon',
    '---',
    '',
    '## Step 1: Escalate to Human Agent',
    '',
    ':::internal Temporary procedure',
    'All slow internet cases are currently escalated directly to a human agent. Full diagnostic flow coming soon.',
    ':::',
    '',
    ':::eddie',
    "I'm going to connect you with one of our support team members so they can investigate your speed issue. They'll be with you shortly!",
    ':::',
    '',
    '{amber|Escalate-SlowInternet}'
  ].join('\n')
};
