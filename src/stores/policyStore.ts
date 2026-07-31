import { useState, useCallback } from 'react';
import type { Policy, Rule, PolicyStatus, RuleStatus } from '../components/Policy/types';

export const RULE_TYPE_ORDER: Record<Rule['type'], number> = {
  override_deny: 0,
  deny: 1,
  allow: 2,
};

export function computePolicyStatus(rules: Rule[]): PolicyStatus {
  if (rules.length === 0) return 'draft';
  const statuses = new Set(rules.map(r => r.status));
  if (statuses.size === 1) {
    const only = [...statuses][0];
    if (only === 'active') return 'active';
    return 'draft';
  }
  return 'mixed';
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function now(): string {
  return new Date().toISOString();
}

const SEED_POLICIES: Policy[] = [
  {
    id: 'p1',
    name: 'Default Allow Web Traffic',
    type: 'organization',
    scope: [],
    enforcementMode: 'selective',
    environment: 'cloudsecure',
    rules: [
      {
        id: 'r1',
        type: 'allow',
        scopeType: 'extra',
        sources: [],
        destinations: [],
        services: [],
        options: { stateless: false, secureConnect: false, machineAuth: false, useWorkloadSubnets: false },
        status: 'active',
        enabled: true,
      },
    ],
    status: 'active',
    lastModified: '2026-07-28T10:00:00Z',
  },
  {
    id: 'p2',
    name: 'Payments App Policy',
    type: 'application',
    scope: [{ category: 'illumio_labels', labels: ['App:Payments', 'Env:Production'] }],
    environment: 'pce',
    rules: [
      {
        id: 'r2',
        type: 'allow',
        scopeType: 'intra',
        sources: [],
        destinations: [],
        services: [],
        options: { stateless: false, secureConnect: false, machineAuth: false, useWorkloadSubnets: false },
        status: 'draft',
        enabled: true,
      },
    ],
    status: 'draft',
    lastModified: '2026-07-29T14:30:00Z',
  },
];

export function usePolicyStore() {
  const [policies, setPolicies] = useState<Policy[]>(SEED_POLICIES);

  const createPolicy = useCallback(
    (draft: Omit<Policy, 'id' | 'rules' | 'status' | 'lastModified'>): Policy => {
      const p: Policy = { ...draft, id: makeId(), rules: [], status: 'draft', lastModified: now() };
      setPolicies(prev => [...prev, p]);
      return p;
    },
    []
  );

  const updatePolicy = useCallback(
    (id: string, patch: Partial<Omit<Policy, 'id' | 'rules'>>) => {
      setPolicies(prev =>
        prev.map(p => (p.id === id ? { ...p, ...patch, lastModified: now() } : p))
      );
    },
    []
  );

  const deletePolicy = useCallback((id: string) => {
    setPolicies(prev => prev.filter(p => p.id !== id));
  }, []);

  const addRule = useCallback(
    (policyId: string, rule: Omit<Rule, 'id' | 'status'>): Rule => {
      const newRule: Rule = { ...rule, id: makeId(), status: 'draft' };
      setPolicies(prev =>
        prev.map(p => {
          if (p.id !== policyId) return p;
          const rules = [...p.rules, newRule];
          return { ...p, rules, status: computePolicyStatus(rules), lastModified: now() };
        })
      );
      return newRule;
    },
    []
  );

  const updateRule = useCallback(
    (policyId: string, ruleId: string, patch: Partial<Omit<Rule, 'id'>>) => {
      setPolicies(prev =>
        prev.map(p => {
          if (p.id !== policyId) return p;
          const rules = p.rules.map(r =>
            r.id === ruleId ? { ...r, ...patch, status: 'modified' as RuleStatus } : r
          );
          return { ...p, rules, status: computePolicyStatus(rules), lastModified: now() };
        })
      );
    },
    []
  );

  const deleteRule = useCallback(
    (policyId: string, ruleId: string) => {
      setPolicies(prev =>
        prev.map(p => {
          if (p.id !== policyId) return p;
          const rules = p.rules.filter(r => r.id !== ruleId);
          return { ...p, rules, status: computePolicyStatus(rules), lastModified: now() };
        })
      );
    },
    []
  );

  const provisionPolicy = useCallback((policyId: string) => {
    setPolicies(prev =>
      prev.map(p => {
        if (p.id !== policyId) return p;
        const rules = p.rules.map(r => ({ ...r, status: 'active' as RuleStatus }));
        return { ...p, rules, status: 'active', lastModified: now() };
      })
    );
  }, []);

  return { policies, createPolicy, updatePolicy, deletePolicy, addRule, updateRule, deleteRule, provisionPolicy };
}
