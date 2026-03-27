import master from './master.js';
import playbookA from './playbook-a.js';
import playbookB from './playbook-b.js';
import playbookC from './playbook-c.js';
import playbookD from './playbook-d.js';
import playbookE from './playbook-e.js';
import playbookF from './playbook-f.js';
import playbookG from './playbook-g.js';
import universalRules from './universal-rules.js';

/**
 * Ordered list of playbook IDs — matches the original Eddie.playbookOrder.
 * @type {string[]}
 */
export const playbookOrder = ['master', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'rules'];

// Aliases used by the Pinia store
export { playbookOrder as defaultPlaybookOrder };

/**
 * All playbooks keyed by ID.
 * @type {Record<string, object>}
 */
export const playbooks = {
  master,
  a: playbookA,
  b: playbookB,
  c: playbookC,
  d: playbookD,
  e: playbookE,
  f: playbookF,
  g: playbookG,
  rules: universalRules,
};

// Alias used by the Pinia store
export { playbooks as defaultPlaybooks };
