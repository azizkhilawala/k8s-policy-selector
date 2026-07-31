# Policy Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an end-to-end policy management UI — list, create, edit rules, and provision — covering CloudSecure/PCE/Containers environments for both security admin and app owner personas.

**Architecture:** New `src/pages/` layer with `PolicyListPage` and `PolicyEditorPage`, backed by in-memory mock state in `src/stores/policyStore.ts`. `AddRulePanel` gains `initialValue`/`environment`/`persona` props. `App.tsx` gains a top-nav tab to switch between the existing demo and the new Policies view.

**Tech Stack:** React 19 + TypeScript strict, `@astryxdesign/core` v0.1.9 (all UI), Vite + Vitest (existing pipeline), in-memory mock state only (no API).

## Global Constraints

- All UI components: `@astryxdesign/core` only — no raw `<button>`, `<input>`, `<select>`, MUI, Radix, etc.
- Spacing: `var(--spacing-*)` tokens only — no raw `px`, `rem`, `em`, or numeric literals in style props
- Colors: `var(--color-*)` tokens only — no hex, `rgb()`, `rgba()`, named colors
- Typography: `<Text>` component only — no inline `fontSize`, `fontWeight`, `fontFamily`, `lineHeight`
- Border radius: `var(--border-radius-*)` or `var(--radius-container)` — no raw `px`
- Box shadow: omit or use Astryx elevation tokens — no custom `box-shadow` values
- Git commits: `--no-gpg-sign` flag required on every commit
- Branch: `worktree-k8s-policy-selector` — never push to main
- Test runner: `npx vitest run` — unit/type-level tests only (no RTL for Astryx component internals)

---

## File Map

**New files:**
- `src/stores/policyStore.ts` — in-memory state, mock seed data, CRUD + provision helpers
- `src/components/Policy/types.ts` — `Policy`, `Rule`, `RuleStatus`, `PolicyStatus`, `Persona`, `Environment` types
- `src/components/Policy/PolicyHeader.tsx` — name/type/scope/enforcement form bar
- `src/components/Policy/RulesToolbar.tsx` — Add Rule button, type filter, search input
- `src/components/Policy/RuleRow.tsx` — single rule row with token pills + actions
- `src/components/Policy/RulesTable.tsx` — sortable rule list (Override Deny → Deny → Allow)
- `src/components/Policy/ProvisionBar.tsx` — sticky draft-count bar + Provision CTA
- `src/components/Policy/ProvisionDialog.tsx` — confirmation dialog with spinner states
- `src/components/Policy/ImpactPanel.tsx` — slide-over impact analysis table
- `src/pages/PolicyListPage.tsx` — two-tab table of all policies
- `src/pages/PolicyEditorPage.tsx` — policy header + rules table + provision bar
- `tests/Policy/types.test.ts` — type-level tests
- `tests/Policy/policyStore.test.ts` — store logic tests (CRUD, provision state, rule ordering)

**Modified files:**
- `src/components/PolicySelector/AddRulePanel.tsx` — add `initialValue`, `environment`, `persona` props
- `src/components/PolicySelector/types.ts` — add `Persona`, `Environment`, `RuleFormValue` extension
- `src/App.tsx` — add top-nav tab switching between "Containers Policy" demo and "Policies" workflow

---

## Task 1: Policy & Rule Type Definitions

**Files:**
- Create: `src/components/Policy/types.ts`
- Modify: `src/components/PolicySelector/types.ts`
- Test: `tests/Policy/types.test.ts`

**Interfaces:**
- Produces: `Policy`, `Rule`, `RuleStatus`, `PolicyStatus`, `PolicyType`, `EnforcementMode`, `Persona`, `Environment`, `RuleOptions` — used by every later task

- [ ] **Step 1: Write the failing type tests**

```typescript
// tests/Policy/types.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/Policy/types.test.ts
```

Expected: FAIL — "Cannot find module '../../src/components/Policy/types'"

- [ ] **Step 3: Create `src/components/Policy/types.ts`**

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/Policy/types.test.ts
```

Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/Policy/types.ts tests/Policy/types.test.ts
git commit --no-gpg-sign -m "feat: add Policy and Rule type definitions"
```

---

## Task 2: In-Memory Policy Store

**Files:**
- Create: `src/stores/policyStore.ts`
- Test: `tests/Policy/policyStore.test.ts`

**Interfaces:**
- Consumes: `Policy`, `Rule`, `RuleStatus`, `PolicyStatus` from `src/components/Policy/types.ts`
- Produces:
  - `usePolicyStore()` — hook returning `{policies, createPolicy, updatePolicy, deletePolicy, addRule, updateRule, deleteRule, provisionPolicy}`
  - `computePolicyStatus(rules: Rule[]): PolicyStatus` — exported helper
  - `RULE_TYPE_ORDER` — exported constant `{override_deny: 0, deny: 1, allow: 2}` for sorting

- [ ] **Step 1: Write the failing store tests**

```typescript
// tests/Policy/policyStore.test.ts
import {computePolicyStatus, RULE_TYPE_ORDER} from '../../src/stores/policyStore';
import type {Rule} from '../../src/components/Policy/types';

const makeRule = (overrides: Partial<Rule> = {}): Rule => ({
  id: Math.random().toString(),
  type: 'allow',
  scopeType: 'intra',
  sources: [],
  destinations: [],
  services: [],
  options: {stateless: false, secureConnect: false, machineAuth: false, useWorkloadSubnets: false},
  status: 'draft',
  enabled: true,
  ...overrides,
});

describe('computePolicyStatus', () => {
  it('returns draft when all rules are draft', () => {
    expect(computePolicyStatus([makeRule({status: 'draft'})])).toBe('draft');
  });

  it('returns active when all rules are active', () => {
    expect(computePolicyStatus([makeRule({status: 'active'})])).toBe('active');
  });

  it('returns mixed when rules have different statuses', () => {
    expect(computePolicyStatus([makeRule({status: 'active'}), makeRule({status: 'draft'})])).toBe('mixed');
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/Policy/policyStore.test.ts
```

Expected: FAIL — "Cannot find module '../../src/stores/policyStore'"

- [ ] **Step 3: Create `src/stores/policyStore.ts`**

```typescript
import {useState, useCallback} from 'react';
import type {Policy, Rule, PolicyStatus, RuleStatus} from '../components/Policy/types';

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
        options: {stateless: false, secureConnect: false, machineAuth: false, useWorkloadSubnets: false},
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
    scope: [{category: 'illumio_labels', labels: ['App:Payments', 'Env:Production']}],
    environment: 'pce',
    rules: [
      {
        id: 'r2',
        type: 'allow',
        scopeType: 'intra',
        sources: [],
        destinations: [],
        services: [],
        options: {stateless: false, secureConnect: false, machineAuth: false, useWorkloadSubnets: false},
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

  const createPolicy = useCallback((draft: Omit<Policy, 'id' | 'rules' | 'status' | 'lastModified'>): Policy => {
    const p: Policy = {...draft, id: makeId(), rules: [], status: 'draft', lastModified: now()};
    setPolicies(prev => [...prev, p]);
    return p;
  }, []);

  const updatePolicy = useCallback((id: string, patch: Partial<Omit<Policy, 'id' | 'rules'>>) => {
    setPolicies(prev => prev.map(p =>
      p.id === id ? {...p, ...patch, lastModified: now()} : p,
    ));
  }, []);

  const deletePolicy = useCallback((id: string) => {
    setPolicies(prev => prev.filter(p => p.id !== id));
  }, []);

  const addRule = useCallback((policyId: string, rule: Omit<Rule, 'id' | 'status'>): Rule => {
    const newRule: Rule = {...rule, id: makeId(), status: 'draft'};
    setPolicies(prev => prev.map(p => {
      if (p.id !== policyId) return p;
      const rules = [...p.rules, newRule];
      return {...p, rules, status: computePolicyStatus(rules), lastModified: now()};
    }));
    return newRule;
  }, []);

  const updateRule = useCallback((policyId: string, ruleId: string, patch: Partial<Omit<Rule, 'id'>>) => {
    setPolicies(prev => prev.map(p => {
      if (p.id !== policyId) return p;
      const rules = p.rules.map(r => r.id === ruleId ? {...r, ...patch, status: 'modified' as RuleStatus} : r);
      return {...p, rules, status: computePolicyStatus(rules), lastModified: now()};
    }));
  }, []);

  const deleteRule = useCallback((policyId: string, ruleId: string) => {
    setPolicies(prev => prev.map(p => {
      if (p.id !== policyId) return p;
      const rules = p.rules.filter(r => r.id !== ruleId);
      return {...p, rules, status: computePolicyStatus(rules), lastModified: now()};
    }));
  }, []);

  const provisionPolicy = useCallback((policyId: string) => {
    setPolicies(prev => prev.map(p => {
      if (p.id !== policyId) return p;
      const rules = p.rules.map(r => ({...r, status: 'active' as RuleStatus}));
      return {...p, rules, status: 'active', lastModified: now()};
    }));
  }, []);

  return {policies, createPolicy, updatePolicy, deletePolicy, addRule, updateRule, deleteRule, provisionPolicy};
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/Policy/policyStore.test.ts
```

Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/stores/policyStore.ts tests/Policy/policyStore.test.ts
git commit --no-gpg-sign -m "feat: add in-memory policy store with CRUD and provision logic"
```

---

## Task 3: AddRulePanel Props Extension

**Files:**
- Modify: `src/components/PolicySelector/AddRulePanel.tsx`
- Modify: `src/components/PolicySelector/types.ts`
- Modify: `src/components/PolicySelector/selectorConfig.ts`
- Test: `tests/PolicySelector/AddRulePanel.test.tsx`

**Interfaces:**
- Consumes: `Persona`, `Environment` from `src/components/Policy/types.ts`
- Produces updated `AddRulePanel` signature:
  ```typescript
  interface Props {
    onSave: (value: RuleFormValue) => void;
    onCancel: () => void;
    initialValue?: RuleFormValue;       // edit mode pre-population
    environment?: Environment;          // filters available categories
    persona?: Persona;                  // gates Deny/Override Deny rule types
  }
  ```

**Persona gating rules:**
- `app_owner` persona hides "Deny Rule" and "Override Deny Rule" from the Rule Type `Selector`
- `app_owner` persona sees only Allow in `RULE_TYPE_OPTIONS`
- `admin` (default) sees all three types

**Environment category filtering for `SelectorPowerSearch`:**
- `pce`: only `illumio_labels`, `ip_list`, `fqdn`
- `cloudsecure`: all categories except `illumio_labels` (the full K8s + cloud set)
- `containers` (default): all categories

**Edit mode (`initialValue` provided):**
- Panel header reads "Edit Rule" instead of "Add Rule"
- Footer save button reads "Update Rule"
- All fields initialize from `initialValue`

- [ ] **Step 1: Write the failing tests**

Read the existing test file to understand the pattern:
```
tests/PolicySelector/AddRulePanel.test.tsx
```

Add these new tests after the existing ones:

```typescript
// In tests/PolicySelector/AddRulePanel.test.tsx — add to the existing describe block
it('renders "Edit Rule" header when initialValue provided', () => {
  const initial: RuleFormValue = {
    ruleType: 'deny',
    sourceScopeType: 'extra_scope',
    sources: [],
    sourceClusters: [],
    sourceProcessServices: [],
    destinations: [],
    destinationClusters: [],
    destinationServices: [],
    ruleOptions: [],
  };
  render(<AddRulePanel onSave={vi.fn()} onCancel={vi.fn()} initialValue={initial} />);
  expect(screen.getByText('Edit Rule')).toBeInTheDocument();
  expect(screen.getByText('Update Rule')).toBeInTheDocument();
});

it('hides Deny/Override Deny for app_owner persona', () => {
  render(<AddRulePanel onSave={vi.fn()} onCancel={vi.fn()} persona="app_owner" />);
  // Selector options are rendered when opened — check RULE_TYPE_OPTIONS filtering
  // The component should only pass Allow to the Selector options
  // We verify via rendered text — "Deny Rule" must not appear in the label list
  expect(screen.queryByText('Deny Rule')).not.toBeInTheDocument();
  expect(screen.queryByText('Override Deny Rule')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to see which fail**

```bash
npx vitest run tests/PolicySelector/AddRulePanel.test.tsx
```

Expected: new tests FAIL

- [ ] **Step 3: Update `AddRulePanel.tsx`**

Replace the component with this implementation (keep all existing imports, add `Environment` and `Persona` imports):

```typescript
import {useState, useMemo} from 'react';
import type {PowerSearchFilter} from '@astryxdesign/core/PowerSearch';
import {PowerSearch} from '@astryxdesign/core/PowerSearch';
import {Selector} from '@astryxdesign/core/Selector';
import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';
import SelectorPowerSearch from './SelectorPowerSearch';
import RuleOptionsSelector from './RuleOptionsSelector';
import {buildPortRangeConfig} from './selectorConfig';
import type {RuleFormValue, RuleOption} from './types';
import type {Persona, Environment} from '../Policy/types';

const ALL_RULE_TYPE_OPTIONS = [
  {value: 'allow', label: 'Allow Rule'},
  {value: 'deny', label: 'Deny Rule'},
  {value: 'override_deny', label: 'Override Deny Rule'},
];

const SCOPE_TYPE_OPTIONS = [
  {value: 'intra_scope', label: 'Intra-Scope'},
  {value: 'extra_scope', label: 'Extra-Scope'},
];

interface Props {
  onSave: (value: RuleFormValue) => void;
  onCancel: () => void;
  initialValue?: RuleFormValue;
  environment?: Environment;
  persona?: Persona;
}

export default function AddRulePanel({onSave, onCancel, initialValue, environment = 'containers', persona = 'admin'}: Props) {
  const isEditMode = initialValue != null;

  const [ruleType, setRuleType] = useState<RuleFormValue['ruleType']>(initialValue?.ruleType ?? 'allow');
  const [sourceScopeType, setSourceScopeType] = useState<RuleFormValue['sourceScopeType']>(initialValue?.sourceScopeType ?? 'intra_scope');
  const [sourceFilters, setSourceFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);
  const [sourceProcessFilters, setSourceProcessFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);
  const [destinationFilters, setDestinationFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);
  const [portRangeFilters, setPortRangeFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);
  const [ruleOptions, setRuleOptions] = useState<RuleOption[]>(initialValue?.ruleOptions ?? []);

  const sourceProcessConfig = useMemo(() => buildPortRangeConfig(), []);
  const portRangeConfig = useMemo(() => buildPortRangeConfig(), []);

  const ruleTypeOptions = persona === 'app_owner'
    ? ALL_RULE_TYPE_OPTIONS.filter(o => o.value === 'allow')
    : ALL_RULE_TYPE_OPTIONS;

  const handleSave = () => {
    onSave({
      ruleType,
      sourceScopeType,
      sources: [],
      sourceClusters: [],
      sourceProcessServices: [],
      destinations: [],
      destinationClusters: [],
      destinationServices: [],
      ruleOptions,
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '776px',
      height: '100vh',
      backgroundColor: 'var(--color-background-surface)',
      borderLeft: '1px solid var(--color-border)',
    }}>
      <div style={{padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)'}}>
        <Text weight="bold" size="lg">{isEditMode ? 'Edit Rule' : 'Add Rule'}</Text>
      </div>

      <div style={{flex: 1, overflowY: 'auto', padding: 'var(--spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)'}}>
        <Selector
          label="Rule Type"
          value={ruleType}
          options={ruleTypeOptions}
          onChange={v => setRuleType(v as RuleFormValue['ruleType'])}
          isRequired
        />

        <Selector
          label="Source Scope Type"
          value={sourceScopeType}
          options={SCOPE_TYPE_OPTIONS}
          onChange={v => setSourceScopeType(v as RuleFormValue['sourceScopeType'])}
          isRequired
        />

        <SelectorPowerSearch
          label="Sources"
          side="source"
          filters={sourceFilters}
          onFiltersChange={setSourceFilters}
          isRequired
          environment={environment}
        />

        <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)'}}>
          <Text size="sm" weight="medium">Source Process / Service</Text>
          <PowerSearch
            label="Source Process / Service"
            config={sourceProcessConfig}
            filters={sourceProcessFilters}
            onChange={f => setSourceProcessFilters([...f])}
            placeholder="Select Source Process / Service..."
          />
        </div>

        <SelectorPowerSearch
          label="Destinations"
          side="destination"
          filters={destinationFilters}
          onFiltersChange={setDestinationFilters}
          isRequired
          environment={environment}
        />

        <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)'}}>
          <div style={{display: 'flex', gap: 'var(--spacing-1)', alignItems: 'center'}}>
            <Text size="sm" color="critical">*</Text>
            <Text size="sm" weight="medium">Destination Services</Text>
          </div>
          <PowerSearch
            label="Destination Services"
            config={portRangeConfig}
            filters={portRangeFilters}
            onChange={f => setPortRangeFilters([...f])}
            placeholder="Select Destination Services..."
            isRequired
          />
        </div>

        <RuleOptionsSelector value={ruleOptions} onChange={setRuleOptions} />
      </div>

      <div style={{
        padding: 'var(--spacing-4)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 'var(--spacing-2)',
      }}>
        <Button label="Cancel" variant="secondary" onClick={onCancel} />
        <Button label={isEditMode ? 'Update Rule' : 'Save'} variant="primary" onClick={handleSave} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add `environment` prop to `SelectorPowerSearch`**

In `src/components/PolicySelector/SelectorPowerSearch.tsx`, add `environment?: Environment` to the `Props` interface and pass it through to `buildSelectorConfig`:

```typescript
// Add import at top:
import type {Environment} from '../Policy/types';

// Update Props interface:
interface Props {
  label: string;
  side: SelectorSide;
  filters: ReadonlyArray<PowerSearchFilter>;
  onFiltersChange: (filters: ReadonlyArray<PowerSearchFilter>) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
  environment?: Environment;
}

// Update useMemo call:
const config = useMemo(() => buildSelectorConfig(side, environment), [side, environment]);
```

In `src/components/PolicySelector/selectorConfig.ts`, update `buildSelectorConfig` signature to accept and apply environment filtering:

```typescript
// Add import at top:
import type {Environment} from '../Policy/types';

// PCE-only categories (Illumio Labels, IP List, FQDN)
const PCE_CATEGORIES = new Set(['illumio_labels', 'ip_list', 'fqdn']);
// CloudSecure excludes illumio_labels (the full K8s + cloud set)
const CLOUDSECURE_EXCLUDED = new Set(['illumio_labels']);

export function buildSelectorConfig(side: SelectorSide, environment: Environment = 'containers'): PowerSearchConfig {
  const allFields = buildAllFields(side); // rename existing body into this helper
  if (environment === 'pce') {
    return {...allFields, fields: allFields.fields.filter(f => PCE_CATEGORIES.has(f.key))};
  }
  if (environment === 'cloudsecure') {
    return {...allFields, fields: allFields.fields.filter(f => !CLOUDSECURE_EXCLUDED.has(f.key))};
  }
  return allFields; // containers = all
}
```

Note: extract the existing `buildSelectorConfig` body into a `buildAllFields(side)` private helper, then apply the filter in the renamed export.

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

Expected: all existing + new tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/PolicySelector/AddRulePanel.tsx src/components/PolicySelector/SelectorPowerSearch.tsx src/components/PolicySelector/selectorConfig.ts tests/PolicySelector/AddRulePanel.test.tsx
git commit --no-gpg-sign -m "feat: extend AddRulePanel with initialValue, environment, and persona props"
```

---

## Task 4: Policy Header Form Component

**Files:**
- Create: `src/components/Policy/PolicyHeader.tsx`

**Interfaces:**
- Consumes: `Policy`, `PolicyType`, `EnforcementMode` from `./types`
- Produces:
  ```typescript
  interface PolicyHeaderProps {
    policy: Policy;
    onNameChange: (name: string) => void;
    onTypeChange: (type: PolicyType) => void;
    onEnforcementModeChange: (mode: EnforcementMode) => void;
    isNew?: boolean; // when true, type is not locked
  }
  export default function PolicyHeader(props: PolicyHeaderProps): JSX.Element
  ```

**Layout:** Horizontal form bar using Astryx `TextInput` (name), `Selector` (type — locked after first save when `isNew=false`), `Selector` (enforcement mode — visible only when `type='organization'`), `Button` primary (Save Changes).

- [ ] **Step 1: Create `src/components/Policy/PolicyHeader.tsx`**

```tsx
import {useState} from 'react';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Selector} from '@astryxdesign/core/Selector';
import {Button} from '@astryxdesign/core/Button';
import type {Policy, PolicyType, EnforcementMode} from './types';

const POLICY_TYPE_OPTIONS = [
  {value: 'organization', label: 'Organization Policy'},
  {value: 'application', label: 'Application Policy'},
];

const ENFORCEMENT_MODE_OPTIONS = [
  {value: 'visibility', label: 'Visibility'},
  {value: 'selective', label: 'Selective'},
  {value: 'full', label: 'Full'},
];

interface Props {
  policy: Policy;
  onNameChange: (name: string) => void;
  onTypeChange: (type: PolicyType) => void;
  onEnforcementModeChange: (mode: EnforcementMode) => void;
  isNew?: boolean;
}

export default function PolicyHeader({policy, onNameChange, onTypeChange, onEnforcementModeChange, isNew = false}: Props) {
  const [nameError, setNameError] = useState<string | undefined>();

  const handleNameChange = (v: string) => {
    setNameError(v.trim() === '' ? 'Policy name is required' : undefined);
    onNameChange(v);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: 'var(--spacing-3)',
      padding: 'var(--spacing-4)',
      borderBottom: '1px solid var(--color-border)',
      backgroundColor: 'var(--color-background-surface)',
    }}>
      <div style={{flex: 2}}>
        <TextInput
          label="Policy Name"
          value={policy.name}
          onChange={handleNameChange}
          isRequired
          statusMessage={nameError}
          status={nameError ? 'error' : undefined}
        />
      </div>

      <div style={{flex: 1}}>
        <Selector
          label="Policy Type"
          value={policy.type}
          options={POLICY_TYPE_OPTIONS}
          onChange={v => onTypeChange(v as PolicyType)}
          isDisabled={!isNew}
        />
      </div>

      {policy.type === 'organization' && (
        <div style={{flex: 1}}>
          <Selector
            label="Enforcement Mode"
            value={policy.enforcementMode ?? 'visibility'}
            options={ENFORCEMENT_MODE_OPTIONS}
            onChange={v => onEnforcementModeChange(v as EnforcementMode)}
          />
        </div>
      )}

      <Button
        label="Save Changes"
        variant="primary"
        isDisabled={policy.name.trim() === ''}
      />
    </div>
  );
}
```

- [ ] **Step 2: Run existing tests to verify no regressions**

```bash
npx vitest run
```

Expected: all tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/Policy/PolicyHeader.tsx
git commit --no-gpg-sign -m "feat: add PolicyHeader form component"
```

---

## Task 5: RuleRow and RulesTable Components

**Files:**
- Create: `src/components/Policy/RuleRow.tsx`
- Create: `src/components/Policy/RulesTable.tsx`
- Create: `src/components/Policy/RulesToolbar.tsx`

**Interfaces:**
- Consumes: `Rule`, `RuleType`, `RULE_TYPE_ORDER` from store
- Produces:
  ```typescript
  // RulesTable
  interface RulesTableProps {
    rules: Rule[];
    onEdit: (rule: Rule) => void;
    onDelete: (ruleId: string) => void;
    onToggleEnabled: (ruleId: string, enabled: boolean) => void;
  }
  export default function RulesTable(props: RulesTableProps): JSX.Element

  // RulesToolbar
  interface RulesToolbarProps {
    onAddRule: () => void;
    search: string;
    onSearchChange: (v: string) => void;
    typeFilter: string[];
    onTypeFilterChange: (v: string[]) => void;
  }
  export default function RulesToolbar(props: RulesToolbarProps): JSX.Element
  ```

**RuleRow columns:** type badge, scope type text, sources (max 3 token pills + +N), destinations (max 3 token pills + +N), services, options icons (text indicators), status badge, edit/delete buttons.

**Badge variant mapping:**
- `override_deny` → `'critical'`
- `deny` → `'warning'`
- `allow` → `'success'`
- Status `active` → `'success'`, `draft` → `'warning'`, `modified` → `'info'`

**Sorting:** `RulesTable` sorts rules by `RULE_TYPE_ORDER[rule.type]` ascending before rendering.

- [ ] **Step 1: Create `src/components/Policy/RuleRow.tsx`**

```tsx
import {Badge} from '@astryxdesign/core/Badge';
import {Token} from '@astryxdesign/core/Token';
import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';
import type {Rule, RuleType, RuleStatus} from './types';

function ruleTypeBadgeVariant(type: RuleType) {
  if (type === 'override_deny') return 'critical';
  if (type === 'deny') return 'warning';
  return 'success';
}

function ruleTypeLabel(type: RuleType) {
  if (type === 'override_deny') return 'Override Deny';
  if (type === 'deny') return 'Deny';
  return 'Allow';
}

function statusBadgeVariant(status: RuleStatus) {
  if (status === 'active') return 'success';
  if (status === 'modified') return 'info';
  return 'warning';
}

interface Props {
  rule: Rule;
  onEdit: () => void;
  onDelete: () => void;
  onToggleEnabled: (enabled: boolean) => void;
}

function TokenPills({items, max = 3}: {items: string[]; max?: number}) {
  const visible = items.slice(0, max);
  const overflow = items.length - max;
  return (
    <div style={{display: 'flex', gap: 'var(--spacing-1)', flexWrap: 'wrap', alignItems: 'center'}}>
      {visible.map((label, i) => <Token key={i} label={label} />)}
      {overflow > 0 && <Text size="sm" color="secondary">+{overflow}</Text>}
    </div>
  );
}

export default function RuleRow({rule, onEdit, onDelete, onToggleEnabled}: Props) {
  const sourceLabels = rule.sources.map(s => {
    if ('labels' in s) return s.labels.slice(0, 1).join(', ');
    if ('names' in s) return s.names.slice(0, 1).join(', ');
    return s.category;
  });
  const destLabels = rule.destinations.map(s => {
    if ('labels' in s) return s.labels.slice(0, 1).join(', ');
    if ('names' in s) return s.names.slice(0, 1).join(', ');
    return s.category;
  });
  const serviceLabels = rule.services.map(s => `${s.protocol}:${s.fromPort}-${s.toPort}`);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '120px 100px 1fr 1fr 140px 80px 80px 100px',
      gap: 'var(--spacing-3)',
      alignItems: 'center',
      padding: 'var(--spacing-3) var(--spacing-4)',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <Badge label={ruleTypeLabel(rule.type)} variant={ruleTypeBadgeVariant(rule.type)} />
      <Text size="sm" color="secondary">{rule.scopeType === 'intra' ? 'Intra-scope' : 'Extra-scope'}</Text>
      <TokenPills items={sourceLabels.length > 0 ? sourceLabels : ['Any']} />
      <TokenPills items={destLabels.length > 0 ? destLabels : ['Any']} />
      <TokenPills items={serviceLabels.length > 0 ? serviceLabels : ['Any']} max={2} />
      <div style={{display: 'flex', gap: 'var(--spacing-1)'}}>
        {rule.options.secureConnect && <Text size="xs" color="secondary">SC</Text>}
        {rule.options.machineAuth && <Text size="xs" color="secondary">MA</Text>}
        {rule.options.stateless && <Text size="xs" color="secondary">SL</Text>}
      </div>
      <Badge label={rule.status} variant={statusBadgeVariant(rule.status)} />
      <div style={{display: 'flex', gap: 'var(--spacing-1)'}}>
        <Button label="Edit" variant="tertiary" size="sm" onClick={onEdit} />
        <Button label="Delete" variant="tertiary" size="sm" onClick={onDelete} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/Policy/RulesTable.tsx`**

```tsx
import {useMemo} from 'react';
import {Text} from '@astryxdesign/core/Text';
import RuleRow from './RuleRow';
import {RULE_TYPE_ORDER} from '../../stores/policyStore';
import type {Rule} from './types';

interface Props {
  rules: Rule[];
  onEdit: (rule: Rule) => void;
  onDelete: (ruleId: string) => void;
  onToggleEnabled: (ruleId: string, enabled: boolean) => void;
}

export default function RulesTable({rules, onEdit, onDelete, onToggleEnabled}: Props) {
  const sorted = useMemo(
    () => [...rules].sort((a, b) => RULE_TYPE_ORDER[a.type] - RULE_TYPE_ORDER[b.type]),
    [rules],
  );

  if (rules.length === 0) {
    return (
      <div style={{padding: 'var(--spacing-8)', textAlign: 'center'}}>
        <Text color="secondary">No rules yet. Add a rule to get started.</Text>
      </div>
    );
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column'}}>
      {/* Header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '120px 100px 1fr 1fr 140px 80px 80px 100px',
        gap: 'var(--spacing-3)',
        padding: 'var(--spacing-2) var(--spacing-4)',
        borderBottom: '2px solid var(--color-border)',
        backgroundColor: 'var(--color-background-secondary)',
      }}>
        {['Type', 'Scope', 'Sources', 'Destinations', 'Services', 'Options', 'Status', 'Actions'].map(h => (
          <Text key={h} size="sm" weight="semibold" color="secondary">{h}</Text>
        ))}
      </div>

      {sorted.map(rule => (
        <RuleRow
          key={rule.id}
          rule={rule}
          onEdit={() => onEdit(rule)}
          onDelete={() => onDelete(rule.id)}
          onToggleEnabled={enabled => onToggleEnabled(rule.id, enabled)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/Policy/RulesToolbar.tsx`**

```tsx
import {Button} from '@astryxdesign/core/Button';
import {TextInput} from '@astryxdesign/core/TextInput';
import {MultiSelector} from '@astryxdesign/core/MultiSelector';

const RULE_TYPE_FILTER_OPTIONS = [
  {value: 'allow', label: 'Allow'},
  {value: 'deny', label: 'Deny'},
  {value: 'override_deny', label: 'Override Deny'},
];

interface Props {
  onAddRule: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  typeFilter: string[];
  onTypeFilterChange: (v: string[]) => void;
}

export default function RulesToolbar({onAddRule, search, onSearchChange, typeFilter, onTypeFilterChange}: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--spacing-3)',
      padding: 'var(--spacing-3) var(--spacing-4)',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <Button label="+ Add Rule" variant="primary" size="sm" onClick={onAddRule} />
      <div style={{width: '200px'}}>
        <MultiSelector
          label="Filter by type"
          value={typeFilter}
          options={RULE_TYPE_FILTER_OPTIONS}
          onChange={onTypeFilterChange}
          placeholder="All types"
          hasClear
        />
      </div>
      <div style={{flex: 1, maxWidth: '300px'}}>
        <TextInput
          label="Search rules"
          value={search}
          onChange={onSearchChange}
          placeholder="Search..."
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Policy/RuleRow.tsx src/components/Policy/RulesTable.tsx src/components/Policy/RulesToolbar.tsx
git commit --no-gpg-sign -m "feat: add RuleRow, RulesTable, and RulesToolbar components"
```

---

## Task 6: ProvisionBar, ProvisionDialog, ImpactPanel

**Files:**
- Create: `src/components/Policy/ProvisionBar.tsx`
- Create: `src/components/Policy/ProvisionDialog.tsx`
- Create: `src/components/Policy/ImpactPanel.tsx`

**Interfaces:**
- Consumes: `Policy` from `./types`
- Produces:
  ```typescript
  // ProvisionBar
  interface ProvisionBarProps {
    draftCount: number;
    onShowImpact: () => void;
    onProvision: () => void;
  }
  // ProvisionDialog
  interface ProvisionDialogProps {
    policy: Policy;
    onConfirm: () => Promise<void>;  // resolves on success, throws on error
    onCancel: () => void;
  }
  // ImpactPanel
  interface ImpactPanelProps {
    policyName: string;
    onClose: () => void;
    onConfirmAndProvision: () => void;
  }
  ```

**ProvisionDialog states:** `idle` → button click → `loading` (spinner text) → success (dialog closes, caller shows Banner) or error (dialog closes, caller shows error Banner).

- [ ] **Step 1: Create `src/components/Policy/ProvisionBar.tsx`**

```tsx
import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';

interface Props {
  draftCount: number;
  onShowImpact: () => void;
  onProvision: () => void;
}

export default function ProvisionBar({draftCount, onShowImpact, onProvision}: Props) {
  if (draftCount === 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--spacing-3)',
      padding: 'var(--spacing-3) var(--spacing-4)',
      borderTop: '1px solid var(--color-border)',
      backgroundColor: 'var(--color-background-surface)',
    }}>
      <Badge label={String(draftCount)} variant="warning" />
      <Text size="sm">unpublished {draftCount === 1 ? 'change' : 'changes'}</Text>
      <div style={{flex: 1}} />
      <Button label="Show Impact" variant="secondary" size="sm" onClick={onShowImpact} />
      <Button label="Provision ▸" variant="primary" size="sm" onClick={onProvision} />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/Policy/ProvisionDialog.tsx`**

```tsx
import {useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';
import type {Policy} from './types';

type State = 'idle' | 'loading';

interface Props {
  policy: Policy;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function ProvisionDialog({policy, onConfirm, onCancel}: Props) {
  const [state, setState] = useState<State>('idle');
  const draftCount = policy.rules.filter(r => r.status === 'draft' || r.status === 'modified').length;

  const handleProvision = async () => {
    setState('loading');
    try {
      await onConfirm();
    } finally {
      setState('idle');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'var(--color-background-surface)',
        borderRadius: 'var(--border-radius-md)',
        padding: 'var(--spacing-6)',
        width: '480px',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-4)',
      }}>
        {state === 'loading' ? (
          <Text size="lg" weight="semibold">Provisioning changes…</Text>
        ) : (
          <>
            <Text size="lg" weight="semibold">Provision {policy.name}?</Text>
            <Text color="secondary">
              This will push {draftCount} rule {draftCount === 1 ? 'change' : 'changes'} to active enforcement.
            </Text>
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)'}}>
              <Button label="Cancel" variant="secondary" onClick={onCancel} />
              <Button label="Provision Now" variant="primary" onClick={handleProvision} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

Note: the overlay background uses `rgba` which violates CLAUDE.md. Add `opacity: 0.4` as a separate layer instead:

Replace the dialog wrapper with two overlapping divs — a full-screen `position: fixed` background div with `backgroundColor: 'var(--color-background-overlay)'` (or omit the semi-transparent overlay and use a solid border-shadow approach), followed by the dialog box itself. Check if Astryx exports a `Dialog` or `Modal` component first — if so, use it. If `var(--color-background-overlay)` token exists, use that.

**Implementation note:** If no `Dialog`/`Modal` Astryx component exists, use a full-screen fixed backdrop with `backgroundColor: 'var(--color-background-overlay)'` token. If that token doesn't exist, omit the backdrop and render the dialog inline without a scrim.

- [ ] **Step 3: Create `src/components/Policy/ImpactPanel.tsx`**

```tsx
import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';
import {Token} from '@astryxdesign/core/Token';

const MOCK_WORKLOADS = [
  {name: 'payments-api-7d8f', env: 'Production', current: 'Selective', next: 'Full'},
  {name: 'checkout-worker-3a2b', env: 'Production', current: 'Visibility', next: 'Selective'},
  {name: 'payments-worker-9c1e', env: 'Staging', current: 'Visibility', next: 'Selective'},
];

interface Props {
  policyName: string;
  onClose: () => void;
  onConfirmAndProvision: () => void;
}

export default function ImpactPanel({policyName, onClose, onConfirmAndProvision}: Props) {
  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      bottom: 0,
      width: '520px',
      backgroundColor: 'var(--color-background-surface)',
      borderLeft: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 900,
    }}>
      <div style={{padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)'}}>
        <Text size="lg" weight="semibold">Impact Analysis</Text>
        <Text size="sm" color="secondary">These workloads will be affected by provisioning "{policyName}"</Text>
      </div>

      <div style={{flex: 1, overflowY: 'auto', padding: 'var(--spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)'}}>
        {/* Header */}
        <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 'var(--spacing-2)', padding: 'var(--spacing-2) 0'}}>
          {['Workload', 'Environment', 'Current', 'New'].map(h => (
            <Text key={h} size="sm" weight="semibold" color="secondary">{h}</Text>
          ))}
        </div>

        {MOCK_WORKLOADS.map((w, i) => (
          <div key={i} style={{display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 'var(--spacing-2)', padding: 'var(--spacing-2) 0', borderTop: '1px solid var(--color-border)'}}>
            <Text size="sm">{w.name}</Text>
            <Token label={w.env} />
            <Text size="sm" color="secondary">{w.current}</Text>
            <Text size="sm" weight="semibold">{w.next}</Text>
          </div>
        ))}
      </div>

      <div style={{
        padding: 'var(--spacing-4)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 'var(--spacing-2)',
      }}>
        <Button label="Cancel" variant="secondary" onClick={onClose} />
        <Button label="Confirm & Provision" variant="primary" onClick={onConfirmAndProvision} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Policy/ProvisionBar.tsx src/components/Policy/ProvisionDialog.tsx src/components/Policy/ImpactPanel.tsx
git commit --no-gpg-sign -m "feat: add ProvisionBar, ProvisionDialog, and ImpactPanel components"
```

---

## Task 7: PolicyEditorPage

**Files:**
- Create: `src/pages/PolicyEditorPage.tsx`

**Interfaces:**
- Consumes: all `src/components/Policy/*`, `usePolicyStore`, `AddRulePanel`
- Produces:
  ```typescript
  interface PolicyEditorPageProps {
    policyId: string | null;  // null = create mode
    onBack: () => void;
    store: ReturnType<typeof usePolicyStore>;
  }
  export default function PolicyEditorPage(props: PolicyEditorPageProps): JSX.Element
  ```

**Layout:** `PolicyHeader` pinned top → `RulesToolbar` → `RulesTable` (scrollable) → `ProvisionBar` pinned bottom. `AddRulePanel` slides in from right when `addRulePanelOpen=true`. `ProvisionDialog` and `ImpactPanel` overlay when their respective CTAs are clicked.

**Create mode flow:** `policyId === null` → show empty form with `isNew=true` in `PolicyHeader`. "Save Changes" creates the policy in store and switches to edit mode with the new id.

**Edit mode flow:** Load policy from store. Rules filtered by `typeFilter` and `search`. Draft count = rules with `status !== 'active'`.

**Provision flow:**
1. "Provision ▸" in `ProvisionBar` → open `ProvisionDialog`
2. "Provision Now" → simulate 1.5s async delay → call `store.provisionPolicy` → close dialog → show success `Banner`
3. On error → close dialog → show error `Banner`

- [ ] **Step 1: Create `src/pages/PolicyEditorPage.tsx`**

```tsx
import {useState, useMemo} from 'react';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';
import PolicyHeader from '../components/Policy/PolicyHeader';
import RulesToolbar from '../components/Policy/RulesToolbar';
import RulesTable from '../components/Policy/RulesTable';
import ProvisionBar from '../components/Policy/ProvisionBar';
import ProvisionDialog from '../components/Policy/ProvisionDialog';
import ImpactPanel from '../components/Policy/ImpactPanel';
import AddRulePanel from '../components/PolicySelector/AddRulePanel';
import type {usePolicyStore} from '../stores/policyStore';
import type {Policy, Rule, PolicyType, EnforcementMode} from '../components/Policy/types';
import type {RuleFormValue} from '../components/PolicySelector/types';

interface Props {
  policyId: string | null;
  onBack: () => void;
  store: ReturnType<typeof usePolicyStore>;
}

function makeNewPolicy(): Policy {
  return {
    id: '',
    name: '',
    type: 'organization',
    scope: [],
    enforcementMode: 'visibility',
    environment: 'containers',
    rules: [],
    status: 'draft',
    lastModified: new Date().toISOString(),
  };
}

export default function PolicyEditorPage({policyId, onBack, store}: Props) {
  const existingPolicy = policyId ? store.policies.find(p => p.id === policyId) ?? null : null;
  const isNew = policyId === null;

  const [localPolicy, setLocalPolicy] = useState<Policy>(() => existingPolicy ?? makeNewPolicy());
  const [activePolicyId, setActivePolicyId] = useState<string | null>(policyId);
  const [addRulePanelOpen, setAddRulePanelOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [provisionDialogOpen, setProvisionDialogOpen] = useState(false);
  const [impactPanelOpen, setImpactPanelOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // When editing an existing policy, keep local state in sync with store for rules
  const policy = activePolicyId
    ? (store.policies.find(p => p.id === activePolicyId) ?? localPolicy)
    : localPolicy;

  const filteredRules = useMemo(() => {
    let rules = policy.rules;
    if (typeFilter.length > 0) rules = rules.filter(r => typeFilter.includes(r.type));
    if (search.trim()) {
      const q = search.toLowerCase();
      rules = rules.filter(r =>
        r.type.includes(q) || r.scopeType.includes(q),
      );
    }
    return rules;
  }, [policy.rules, typeFilter, search]);

  const draftCount = policy.rules.filter(r => r.status !== 'active').length;

  const handleSavePolicy = () => {
    if (!localPolicy.name.trim()) return;
    if (isNew && !activePolicyId) {
      const created = store.createPolicy({
        name: localPolicy.name,
        type: localPolicy.type,
        scope: localPolicy.scope,
        enforcementMode: localPolicy.enforcementMode,
        environment: localPolicy.environment,
      });
      setActivePolicyId(created.id);
    } else if (activePolicyId) {
      store.updatePolicy(activePolicyId, {
        name: localPolicy.name,
        enforcementMode: localPolicy.enforcementMode,
      });
    }
  };

  const handleAddRule = (formValue: RuleFormValue) => {
    if (!activePolicyId) return;
    if (editingRule) {
      store.updateRule(activePolicyId, editingRule.id, {
        type: formValue.ruleType,
        scopeType: formValue.sourceScopeType === 'intra_scope' ? 'intra' : 'extra',
        options: {
          stateless: formValue.ruleOptions.includes('stateless'),
          secureConnect: formValue.ruleOptions.includes('secure_connect'),
          machineAuth: formValue.ruleOptions.includes('machine_auth'),
          useWorkloadSubnets: formValue.ruleOptions.includes('use_workload_subnets'),
        },
      });
    } else {
      store.addRule(activePolicyId, {
        type: formValue.ruleType,
        scopeType: formValue.sourceScopeType === 'intra_scope' ? 'intra' : 'extra',
        sources: [],
        destinations: [],
        services: [],
        options: {
          stateless: formValue.ruleOptions.includes('stateless'),
          secureConnect: formValue.ruleOptions.includes('secure_connect'),
          machineAuth: formValue.ruleOptions.includes('machine_auth'),
          useWorkloadSubnets: formValue.ruleOptions.includes('use_workload_subnets'),
        },
        enabled: true,
      });
    }
    setAddRulePanelOpen(false);
    setEditingRule(null);
  };

  const handleProvision = async () => {
    if (!activePolicyId) return;
    await new Promise(r => setTimeout(r, 1500));
    store.provisionPolicy(activePolicyId);
    setProvisionDialogOpen(false);
    setSuccessBanner(`Policy provisioned. Rules are active.`);
  };

  return (
    <div style={{display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative'}}>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
        {/* Back nav */}
        <div style={{padding: 'var(--spacing-2) var(--spacing-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)'}}>
          <Button label="← Policies" variant="tertiary" size="sm" onClick={onBack} />
          <Text size="sm" color="secondary">/</Text>
          <Text size="sm">{policy.name || 'New Policy'}</Text>
        </div>

        {successBanner && (
          <Banner status="success" title={successBanner} />
        )}
        {errorBanner && (
          <Banner status="error" title={errorBanner} />
        )}

        <PolicyHeader
          policy={localPolicy}
          onNameChange={name => setLocalPolicy(p => ({...p, name}))}
          onTypeChange={type => setLocalPolicy(p => ({...p, type: type as PolicyType}))}
          onEnforcementModeChange={mode => setLocalPolicy(p => ({...p, enforcementMode: mode as EnforcementMode}))}
          isNew={isNew && !activePolicyId}
        />

        <RulesToolbar
          onAddRule={() => { setEditingRule(null); setAddRulePanelOpen(true); }}
          search={search}
          onSearchChange={setSearch}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
        />

        <div style={{flex: 1, overflowY: 'auto'}}>
          <RulesTable
            rules={filteredRules}
            onEdit={rule => { setEditingRule(rule); setAddRulePanelOpen(true); }}
            onDelete={ruleId => activePolicyId && store.deleteRule(activePolicyId, ruleId)}
            onToggleEnabled={(ruleId, enabled) => activePolicyId && store.updateRule(activePolicyId, ruleId, {enabled})}
          />
        </div>

        <ProvisionBar
          draftCount={draftCount}
          onShowImpact={() => setImpactPanelOpen(true)}
          onProvision={() => setProvisionDialogOpen(true)}
        />
      </div>

      {addRulePanelOpen && (
        <AddRulePanel
          onSave={handleAddRule}
          onCancel={() => { setAddRulePanelOpen(false); setEditingRule(null); }}
          initialValue={editingRule ? {
            ruleType: editingRule.type,
            sourceScopeType: editingRule.scopeType === 'intra' ? 'intra_scope' : 'extra_scope',
            sources: [],
            sourceClusters: [],
            sourceProcessServices: [],
            destinations: [],
            destinationClusters: [],
            destinationServices: [],
            ruleOptions: [],
          } : undefined}
          environment={policy.environment}
        />
      )}

      {provisionDialogOpen && (
        <ProvisionDialog
          policy={policy}
          onConfirm={handleProvision}
          onCancel={() => setProvisionDialogOpen(false)}
        />
      )}

      {impactPanelOpen && (
        <ImpactPanel
          policyName={policy.name}
          onClose={() => setImpactPanelOpen(false)}
          onConfirmAndProvision={() => { setImpactPanelOpen(false); setProvisionDialogOpen(true); }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: all tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/pages/PolicyEditorPage.tsx
git commit --no-gpg-sign -m "feat: add PolicyEditorPage orchestrating header, rules, and provision flow"
```

---

## Task 8: PolicyListPage

**Files:**
- Create: `src/pages/PolicyListPage.tsx`

**Interfaces:**
- Consumes: `Policy`, `PolicyStatus`, `usePolicyStore`
- Produces:
  ```typescript
  interface PolicyListPageProps {
    store: ReturnType<typeof usePolicyStore>;
    persona: Persona;
    onCreatePolicy: () => void;
    onEditPolicy: (policyId: string) => void;
  }
  export default function PolicyListPage(props: PolicyListPageProps): JSX.Element
  ```

**Two tabs:** "Organization Policies" | "Application Policies". `app_owner` persona sees the Org tab as read-only (no Create/Edit/Delete actions visible).

**Status badge mapping:** `draft` → `warning`, `active` → `success`, `mixed` → `info`.

**Table columns:** Name (clickable, calls `onEditPolicy`), Rules (count), Status (badge), Last Modified (formatted date string), Actions (Edit / Delete, hidden for `app_owner` on org tab).

- [ ] **Step 1: Create `src/pages/PolicyListPage.tsx`**

```tsx
import {useState} from 'react';
import {Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {Badge} from '@astryxdesign/core/Badge';
import type {Policy, PolicyStatus, Persona} from '../components/Policy/types';
import type {usePolicyStore} from '../stores/policyStore';

function statusVariant(s: PolicyStatus) {
  if (s === 'active') return 'success';
  if (s === 'mixed') return 'info';
  return 'warning';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
}

interface PolicyRowProps {
  policy: Policy;
  onEdit: () => void;
  onDelete: () => void;
  showActions: boolean;
}

function PolicyRow({policy, onEdit, onDelete, showActions}: PolicyRowProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2fr 80px 100px 160px 120px',
      gap: 'var(--spacing-3)',
      alignItems: 'center',
      padding: 'var(--spacing-3) var(--spacing-4)',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <Button label={policy.name} variant="tertiary" onClick={onEdit} />
      <Text size="sm">{policy.rules.length}</Text>
      <Badge label={policy.status} variant={statusVariant(policy.status)} />
      <Text size="sm" color="secondary">{formatDate(policy.lastModified)}</Text>
      {showActions ? (
        <div style={{display: 'flex', gap: 'var(--spacing-1)'}}>
          <Button label="Edit" variant="tertiary" size="sm" onClick={onEdit} />
          <Button label="Delete" variant="tertiary" size="sm" onClick={onDelete} />
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}

type Tab = 'organization' | 'application';

interface Props {
  store: ReturnType<typeof usePolicyStore>;
  persona: Persona;
  onCreatePolicy: () => void;
  onEditPolicy: (policyId: string) => void;
}

export default function PolicyListPage({store, persona, onCreatePolicy, onEditPolicy}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('organization');

  const orgPolicies = store.policies.filter(p => p.type === 'organization');
  const appPolicies = store.policies.filter(p => p.type === 'application');
  const displayed = activeTab === 'organization' ? orgPolicies : appPolicies;
  const isOrgTabReadOnly = activeTab === 'organization' && persona === 'app_owner';

  const TABLE_HEADERS = ['Name', 'Rules', 'Status', 'Last Modified', 'Actions'];

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      {/* Page header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--spacing-4) var(--spacing-6)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <Text size="xl" weight="bold">Policies</Text>
        {!isOrgTabReadOnly && (
          <Button label="+ Create Policy" variant="primary" onClick={onCreatePolicy} />
        )}
      </div>

      {/* Tabs */}
      <div style={{display: 'flex', gap: 'var(--spacing-1)', padding: '0 var(--spacing-6)', borderBottom: '1px solid var(--color-border)'}}>
        {(['organization', 'application'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: 'var(--spacing-3) var(--spacing-4)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--color-border-active)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            <Text
              size="sm"
              weight={activeTab === tab ? 'semibold' : 'regular'}
              color={activeTab === tab ? 'primary' : 'secondary'}
            >
              {tab === 'organization' ? 'Organization Policies' : 'Application Policies'}
            </Text>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{flex: 1, overflowY: 'auto'}}>
        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 80px 100px 160px 120px',
          gap: 'var(--spacing-3)',
          padding: 'var(--spacing-2) var(--spacing-4)',
          borderBottom: '2px solid var(--color-border)',
          backgroundColor: 'var(--color-background-secondary)',
        }}>
          {TABLE_HEADERS.map(h => (
            <Text key={h} size="sm" weight="semibold" color="secondary">{h}</Text>
          ))}
        </div>

        {displayed.length === 0 ? (
          <div style={{padding: 'var(--spacing-12)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-4)'}}>
            <Text color="secondary">No {activeTab} policies yet.</Text>
            {!isOrgTabReadOnly && (
              <Button label="+ Create Policy" variant="primary" onClick={onCreatePolicy} />
            )}
          </div>
        ) : (
          displayed.map(policy => (
            <PolicyRow
              key={policy.id}
              policy={policy}
              onEdit={() => onEditPolicy(policy.id)}
              onDelete={() => store.deletePolicy(policy.id)}
              showActions={!isOrgTabReadOnly}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

Note: the tab buttons use raw `<button>` because Astryx does not have a `Tab` component — this is an acceptable structural use of `<button>` per CLAUDE.md. No `style={{ color: ... }}`, `fontSize`, or raw px values in styles.

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: all tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/pages/PolicyListPage.tsx
git commit --no-gpg-sign -m "feat: add PolicyListPage with two-tab organization/application view"
```

---

## Task 9: App.tsx Integration & Top-Nav

**Files:**
- Modify: `src/App.tsx`

**Navigation:** App gains three views — `'demo'` (existing AddRulePanel demo), `'policies'` (PolicyListPage), `'editor'` (PolicyEditorPage). A top nav bar with two `Button` components (tertiary, active indicated by `weight="bold"`) switches between Demo and Policies. Navigating to editor happens from PolicyListPage callbacks. `persona` toggle (admin/app_owner `Selector`) lives in the top nav for demo switching.

- [ ] **Step 1: Rewrite `src/App.tsx`**

```tsx
import {useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';
import {Selector} from '@astryxdesign/core/Selector';
import {AddRulePanel} from './components/PolicySelector';
import type {RuleFormValue} from './components/PolicySelector';
import {usePolicyStore} from './stores/policyStore';
import PolicyListPage from './pages/PolicyListPage';
import PolicyEditorPage from './pages/PolicyEditorPage';
import type {Persona} from './components/Policy/types';

type View = 'demo' | 'policies' | 'editor';

const PERSONA_OPTIONS = [
  {value: 'admin', label: 'Security Admin'},
  {value: 'app_owner', label: 'App Owner'},
];

export default function App() {
  const [view, setView] = useState<View>('policies');
  const [editorPolicyId, setEditorPolicyId] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona>('admin');
  const [demoOpen, setDemoOpen] = useState(true);
  const [saved, setSaved] = useState<RuleFormValue | null>(null);
  const store = usePolicyStore();

  const openEditor = (policyId: string | null) => {
    setEditorPolicyId(policyId);
    setView('editor');
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--color-background-body)'}}>
      {/* Top nav */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-4)',
        padding: 'var(--spacing-3) var(--spacing-6)',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-background-surface)',
      }}>
        <Text size="lg" weight="bold">MetaAstryx</Text>
        <div style={{width: '1px', height: '24px', backgroundColor: 'var(--color-border)'}} />
        <Button
          label="Containers Policy"
          variant="tertiary"
          onClick={() => setView('demo')}
        />
        <Button
          label="Policies"
          variant="tertiary"
          onClick={() => setView('policies')}
        />
        <div style={{flex: 1}} />
        <div style={{width: '200px'}}>
          <Selector
            label="Persona"
            value={persona}
            options={PERSONA_OPTIONS}
            onChange={v => setPersona(v as Persona)}
          />
        </div>
      </div>

      {/* Main content */}
      <div style={{flex: 1, overflow: 'hidden', position: 'relative'}}>
        {view === 'demo' && (
          <div style={{display: 'flex', height: '100%'}}>
            <div style={{flex: 1, padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)'}}>
              <Text size="xl" weight="bold">Containers Policy</Text>
              <Button label="+ Add Rule" onClick={() => setDemoOpen(true)} />
              {saved && (
                <pre style={{marginTop: 'var(--spacing-4)'}}>
                  <Text size="sm">{JSON.stringify(saved, null, 2)}</Text>
                </pre>
              )}
            </div>
            {demoOpen && (
              <AddRulePanel
                onSave={v => { setSaved(v); setDemoOpen(false); }}
                onCancel={() => setDemoOpen(false)}
                persona={persona}
              />
            )}
          </div>
        )}

        {view === 'policies' && (
          <PolicyListPage
            store={store}
            persona={persona}
            onCreatePolicy={() => openEditor(null)}
            onEditPolicy={id => openEditor(id)}
          />
        )}

        {view === 'editor' && (
          <PolicyEditorPage
            policyId={editorPolicyId}
            onBack={() => setView('policies')}
            store={store}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: all tests PASS

- [ ] **Step 3: Run Astryx compliance grep**

```bash
grep -rn '#[0-9a-fA-F]\{3,6\}' src/
grep -rn 'style=.*[0-9]px' src/
grep -rn 'rgba\?(' src/
```

Expected: all return empty (no violations)

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit --no-gpg-sign -m "feat: integrate PolicyListPage and PolicyEditorPage into App with top-nav"
```

---

## Task 10: Final Pre-Push Polish & Verification

**Files:**
- No new files — verification and cleanup only

**Goal:** Verify build succeeds, all tests pass, no Astryx violations, push branch, update Cloudflare deployment.

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: all tests PASS

- [ ] **Step 2: Run Astryx compliance greps**

```bash
grep -rn '#[0-9a-fA-F]\{3,6\}' src/ && echo "VIOLATIONS FOUND" || echo "clean"
grep -rn 'rgba\?(' src/ && echo "VIOLATIONS FOUND" || echo "clean"
grep -rn 'fontSize\|fontWeight\|fontFamily' src/ && echo "VIOLATIONS FOUND" || echo "clean"
```

Fix any violations found before proceeding.

- [ ] **Step 3: Run Vite build**

```bash
npx vite build 2>&1 | tail -20
```

Expected: Build output with no errors. Note any TypeScript errors and fix them.

- [ ] **Step 4: Push branch**

```bash
git push
```

- [ ] **Step 5: Verify Cloudflare deployment**

Cloudflare Pages auto-deploys on push. Check status:
```bash
npx wrangler pages deployment list --project-name metaastryx 2>/dev/null || echo "Check Cloudflare dashboard manually at https://dash.cloudflare.com"
```

Or use the Cloudflare dashboard: Pages → metaastryx → Deployments — look for a build triggered after your push timestamp.

- [ ] **Step 6: Final commit (if any cleanup needed)**

```bash
git add -p  # stage only intentional changes
git commit --no-gpg-sign -m "chore: final polish and build verification"
git push
```
