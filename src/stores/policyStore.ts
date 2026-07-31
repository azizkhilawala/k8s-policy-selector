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
    name: 'Global DNS & Monitoring',
    type: 'organization',
    scope: [],
    enforcementMode: 'selective',
    environment: 'containers',
    rules: [
      {
        id: 'r1a',
        type: 'allow',
        scopeType: 'extra',
        sources: [{category: 'k8s_labels', labels: ['app=frontend', 'app=backend', 'app=api']}],
        destinations: [{category: 'k8s_service', names: ['kube-dns', 'metrics-server']}],
        services: [{protocol: 'UDP', fromPort: 53, toPort: 53}, {protocol: 'TCP', fromPort: 53, toPort: 53}],
        options: {stateless: true, secureConnect: false, machineAuth: false, useWorkloadSubnets: false},
        status: 'active',
        enabled: true,
      },
      {
        id: 'r1b',
        type: 'allow',
        scopeType: 'extra',
        sources: [{category: 'k8s_labels', labels: ['app=prometheus', 'app=grafana']}],
        destinations: [{category: 'k8s_labels', labels: ['tier=api', 'tier=web', 'tier=database']}],
        services: [{protocol: 'TCP', fromPort: 9090, toPort: 9090}, {protocol: 'TCP', fromPort: 3000, toPort: 3000}],
        options: {stateless: false, secureConnect: false, machineAuth: false, useWorkloadSubnets: false},
        status: 'active',
        enabled: true,
      },
      {
        id: 'r1c',
        type: 'deny',
        scopeType: 'extra',
        sources: [{category: 'ip_list', ids: ['0.0.0.0/0']}],
        destinations: [{category: 'k8s_labels', labels: ['tier=database']}],
        services: [{protocol: 'TCP', fromPort: 5432, toPort: 5432}, {protocol: 'TCP', fromPort: 3306, toPort: 3306}],
        options: {stateless: false, secureConnect: false, machineAuth: false, useWorkloadSubnets: false},
        status: 'active',
        enabled: true,
      },
    ],
    status: 'active',
    lastModified: '2026-07-25T10:00:00Z',
  },
  {
    id: 'p2',
    name: 'Payments App Policy',
    type: 'application',
    scope: [{category: 'illumio_labels', labels: ['App:payment', 'Env:Production']}],
    environment: 'pce',
    rules: [
      {
        id: 'r2a',
        type: 'allow',
        scopeType: 'intra',
        sources: [{category: 'illumio_labels', labels: ['Role:web']}],
        destinations: [{category: 'illumio_labels', labels: ['Role:api']}],
        services: [{protocol: 'TCP', fromPort: 443, toPort: 443}],
        options: {stateless: false, secureConnect: true, machineAuth: false, useWorkloadSubnets: false},
        status: 'active',
        enabled: true,
      },
      {
        id: 'r2b',
        type: 'allow',
        scopeType: 'intra',
        sources: [{category: 'illumio_labels', labels: ['Role:api']}],
        destinations: [{category: 'illumio_labels', labels: ['Role:database']}],
        services: [{protocol: 'TCP', fromPort: 5432, toPort: 5432}],
        options: {stateless: false, secureConnect: true, machineAuth: true, useWorkloadSubnets: false},
        status: 'draft',
        enabled: true,
      },
      {
        id: 'r2c',
        type: 'deny',
        scopeType: 'extra',
        sources: [{category: 'ip_list', ids: ['10.0.0.0/8']}],
        destinations: [{category: 'illumio_labels', labels: ['Role:database']}],
        services: [{protocol: 'TCP', fromPort: 1, toPort: 65535}],
        options: {stateless: false, secureConnect: false, machineAuth: false, useWorkloadSubnets: false},
        status: 'active',
        enabled: true,
      },
    ],
    status: 'mixed',
    lastModified: '2026-07-29T14:30:00Z',
  },
  {
    id: 'p3',
    name: 'E-Commerce Frontend',
    type: 'application',
    scope: [{category: 'k8s_labels', labels: ['app=frontend', 'env=production']}],
    environment: 'containers',
    rules: [
      {
        id: 'r3a',
        type: 'allow',
        scopeType: 'extra',
        sources: [{category: 'ip_list', ids: ['0.0.0.0/0']}],
        destinations: [{category: 'k8s_service', names: ['nginx-ingress-controller']}],
        services: [{protocol: 'TCP', fromPort: 80, toPort: 80}, {protocol: 'TCP', fromPort: 443, toPort: 443}],
        options: {stateless: false, secureConnect: false, machineAuth: false, useWorkloadSubnets: false},
        status: 'active',
        enabled: true,
      },
      {
        id: 'r3b',
        type: 'allow',
        scopeType: 'intra',
        sources: [{category: 'k8s_labels', labels: ['app=frontend']}],
        destinations: [{category: 'k8s_labels', labels: ['app=backend']}],
        services: [{protocol: 'TCP', fromPort: 8080, toPort: 8080}],
        options: {stateless: false, secureConnect: false, machineAuth: false, useWorkloadSubnets: false},
        status: 'active',
        enabled: true,
      },
      {
        id: 'r3c',
        type: 'allow',
        scopeType: 'intra',
        sources: [{category: 'k8s_labels', labels: ['app=backend']}],
        destinations: [{category: 'k8s_labels', labels: ['app=worker']}],
        services: [{protocol: 'TCP', fromPort: 6379, toPort: 6379}],
        options: {stateless: false, secureConnect: false, machineAuth: false, useWorkloadSubnets: false},
        status: 'draft',
        enabled: true,
      },
    ],
    status: 'mixed',
    lastModified: '2026-07-28T09:15:00Z',
  },
  {
    id: 'p4',
    name: 'Cloud Network Segmentation',
    type: 'organization',
    scope: [],
    enforcementMode: 'full',
    environment: 'cloudsecure',
    rules: [
      {
        id: 'r4a',
        type: 'override_deny',
        scopeType: 'extra',
        sources: [{category: 'ip_list', ids: ['0.0.0.0/0']}],
        destinations: [{category: 'cloud_aws_account', accountIds: ['123456789012']}],
        services: [{protocol: 'TCP', fromPort: 22, toPort: 22}],
        options: {stateless: false, secureConnect: false, machineAuth: false, useWorkloadSubnets: false},
        status: 'active',
        enabled: true,
      },
      {
        id: 'r4b',
        type: 'allow',
        scopeType: 'intra',
        sources: [{category: 'cloud_aws_account', accountIds: ['123456789012']}],
        destinations: [{category: 'cloud_aws_account', accountIds: ['234567890123']}],
        services: [{protocol: 'TCP', fromPort: 443, toPort: 443}],
        options: {stateless: false, secureConnect: false, machineAuth: false, useWorkloadSubnets: true},
        status: 'active',
        enabled: true,
      },
    ],
    status: 'active',
    lastModified: '2026-07-20T16:45:00Z',
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
