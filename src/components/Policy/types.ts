import type {SelectorValue, PortRange} from '../PolicySelector/types';

export type PolicyType = 'organization' | 'application';
export type EnforcementMode = 'visibility' | 'selective' | 'full';
export type PolicyStatus = 'draft' | 'active' | 'mixed';
export type RuleStatus = 'draft' | 'active' | 'modified';
export type RuleType = 'allow' | 'deny' | 'override_deny';
export type Persona = 'admin' | 'app_owner';
export type Environment = 'cloudsecure' | 'pce' | 'containers';

export interface RuleOptions {
  stateless: boolean;
  secureConnect: boolean;
  machineAuth: boolean;
  useWorkloadSubnets: boolean;
}

export interface Rule {
  id: string;
  type: RuleType;
  scopeType: 'intra' | 'extra';
  sources: SelectorValue[];
  destinations: SelectorValue[];
  services: PortRange[];
  options: RuleOptions;
  status: RuleStatus;
  enabled: boolean;
}

export interface Policy {
  id: string;
  name: string;
  type: PolicyType;
  scope: SelectorValue[];
  enforcementMode?: EnforcementMode;
  environment: Environment;
  rules: Rule[];
  status: PolicyStatus;
  lastModified: string;
}
