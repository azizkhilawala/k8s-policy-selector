import { describe, it, expect } from 'vitest';
import { computePolicyStatus, RULE_TYPE_ORDER } from '../../src/stores/policyStore';
import type { Rule } from '../../src/components/Policy/types';

const makeRule = (overrides: Partial<Rule> = {}): Rule => ({
  id: Math.random().toString(),
  type: 'allow',
  scopeType: 'intra',
  sources: [],
  destinations: [],
  services: [],
  options: { stateless: false, secureConnect: false, machineAuth: false, useWorkloadSubnets: false },
  status: 'draft',
  enabled: true,
  ...overrides,
});

describe('computePolicyStatus', () => {
  it('returns draft when all rules are draft', () => {
    expect(computePolicyStatus([makeRule({ status: 'draft' })])).toBe('draft');
  });

  it('returns active when all rules are active', () => {
    expect(computePolicyStatus([makeRule({ status: 'active' })])).toBe('active');
  });

  it('returns mixed when rules have different statuses', () => {
    expect(computePolicyStatus([makeRule({ status: 'active' }), makeRule({ status: 'draft' })])).toBe('mixed');
  });

  it('returns draft for empty rule list', () => {
    expect(computePolicyStatus([])).toBe('draft');
  });
});

describe('RULE_TYPE_ORDER', () => {
  it('orders override_deny before deny before allow', () => {
    expect(RULE_TYPE_ORDER.override_deny).toBeLessThan(RULE_TYPE_ORDER.deny);
    expect(RULE_TYPE_ORDER.deny).toBeLessThan(RULE_TYPE_ORDER.allow);
  });
});
