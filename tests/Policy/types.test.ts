import type {Policy, Rule, RuleOptions, Persona, Environment} from '../../src/components/Policy/types';

describe('Policy types', () => {
  it('PolicyStatus discriminates all values', () => {
    const statuses: Policy['status'][] = ['draft', 'active', 'mixed'];
    expect(statuses).toHaveLength(3);
  });

  it('RuleType discriminates all values', () => {
    const types: Rule['type'][] = ['allow', 'deny', 'override_deny'];
    expect(types).toHaveLength(3);
  });

  it('Persona discriminates admin and app_owner', () => {
    const personas: Persona[] = ['admin', 'app_owner'];
    expect(personas).toHaveLength(2);
  });

  it('Environment discriminates all three envs', () => {
    const envs: Environment[] = ['cloudsecure', 'pce', 'containers'];
    expect(envs).toHaveLength(3);
  });

  it('RuleOptions has all four option flags', () => {
    const opts: RuleOptions = {stateless: false, secureConnect: false, machineAuth: false, useWorkloadSubnets: false};
    expect(Object.keys(opts)).toHaveLength(4);
  });

  it('Rule with intra scopeType and allow type is valid', () => {
    const rule: Rule = {
      id: 'r1',
      type: 'allow',
      scopeType: 'intra',
      sources: [],
      destinations: [],
      services: [],
      options: {stateless: false, secureConnect: false, machineAuth: false, useWorkloadSubnets: false},
      status: 'draft',
      enabled: true,
    };
    expect(rule.type).toBe('allow');
    expect(rule.scopeType).toBe('intra');
  });
});
