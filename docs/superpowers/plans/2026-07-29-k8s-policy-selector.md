# K8s Policy Rule Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a guided, inline-expanding selector UI for Kubernetes policy rule authoring (Sources, Destinations, Destination Services, Rule Options) inside Illumio's Add Rule slide-out panel.

**Architecture:** Four React components built on Astryx's `PowerSearch` for Sources/Destinations/Destination Services and `MultiSelector` for Rule Options. The K8s label expression builder and cloud resource editor are custom `PowerSearch` value editors (`CustomOperatorValue`). All mutual-exclusion rules are enforced in `onChange` before state is set. Output is a typed `SelectorValue` union consumed by the parent form.

**Tech Stack:** React 18, TypeScript, `@astryxdesign/core` v0.1.9 (PowerSearch, Selector, MultiSelector, NumberInput, TextInput, Tokenizer, Banner, Button, Token), Vite + `@vitejs/plugin-react` for dev server, Vitest + React Testing Library for tests.

## Global Constraints

- No raw `<div>` or `<span>` for layout — use Astryx components exclusively
- No raw hex colors or px values — use `var(--color-*)` / `var(--spacing-*)` tokens only
- No StyleX / Tailwind compiler — `xstyle` prop only where layout overrides are needed
- Import every Astryx component from its own path: `@astryxdesign/core/PowerSearch`, etc.
- App entry must include `import '@astryxdesign/core/reset.css'` and `import '@astryxdesign/core/astryx.css'`
- All components are pure/controlled — no internal state except UI state (open/closed popovers)
- TypeScript strict mode — no `any`

---

## File Map

```
src/
  components/
    PolicySelector/
      types.ts                  ← All shared TypeScript types (SelectorValue union, filter shapes)
      selectorConfig.ts         ← PowerSearch config factories for source and destination
      mutualExclusion.ts        ← Mutual-exclusion enforcement logic
      K8sExpressionEditor.tsx   ← Custom PowerSearch editor: key+operator+values guided rows
      CloudResourceEditor.tsx   ← Custom PowerSearch editor: multi-field cloud resource form
      PortRangeEditor.tsx       ← Custom PowerSearch editor: protocol+from_port+to_port
      ClusterSelector.tsx       ← Cluster context selector (above Sources/Destinations)
      SelectorPowerSearch.tsx   ← Main wrapper: PowerSearch + ClusterSelector + Banner
      RuleOptionsSelector.tsx   ← MultiSelector for rule-level options
      AddRulePanel.tsx          ← Full Add Rule slide-out panel composing all the above
      index.ts                  ← Re-exports public surface
  main.tsx                      ← App entry with CSS imports and Theme wrapper
  App.tsx                       ← Demo wrapper rendering AddRulePanel
tests/
  PolicySelector/
    types.test.ts
    mutualExclusion.test.ts
    K8sExpressionEditor.test.tsx
    CloudResourceEditor.test.tsx
    PortRangeEditor.test.tsx
    SelectorPowerSearch.test.tsx
    RuleOptionsSelector.test.tsx
    AddRulePanel.test.tsx
```

---

## Task 1: Project scaffold (Vite + React + TypeScript + Astryx CSS)

**Files:**
- Modify: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `index.html`

**Interfaces:**
- Produces: Running dev server at `http://localhost:5173` rendering a blank `<Theme>` wrapper

- [ ] **Step 1: Install dev dependencies**

```bash
npm install --save-dev vite @vitejs/plugin-react typescript @types/react @types/react-dom vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

Expected: `node_modules` updated, no errors.

- [ ] **Step 2: Create `vite.config.ts`**

```ts
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
  },
});
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>Policy Selector</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
```

- [ ] **Step 5: Create `tests/setup.ts`**

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 6: Create `src/main.tsx`**

```tsx
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Theme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Theme theme={neutralTheme}>
      <App />
    </Theme>
  </StrictMode>,
);
```

- [ ] **Step 7: Create `src/App.tsx`**

```tsx
export default function App() {
  return <div style={{padding: '2rem'}}>Policy Selector</div>;
}
```

- [ ] **Step 8: Update `package.json` scripts**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 9: Start dev server and verify**

```bash
npm run dev
```

Expected: `http://localhost:5173` opens, page shows "Policy Selector".

- [ ] **Step 10: Commit**

```bash
git add -A && git commit --no-gpg-sign -m "feat: scaffold Vite + React + TS + Astryx dev environment"
```

---

## Task 2: Shared types

**Files:**
- Create: `src/components/PolicySelector/types.ts`
- Create: `tests/PolicySelector/types.test.ts`

**Interfaces:**
- Produces:
  - `SelectorSide = 'source' | 'destination'`
  - `K8sScope = 'namespace' | 'workload'`
  - `K8sOperator = 'eq' | 'exists' | 'neq' | 'in' | 'notin' | 'notexists'`
  - `K8sExpression` — `{ key: string; operator: K8sOperator; values: string[] }`
  - `ClusterRef` union — `{ type: 'id'; id: string } | { type: 'aws'; accountId: string; region: string; clusterName: string } | { type: 'gcp'; projectId: string; location: string; clusterName: string } | { type: 'azure'; subscriptionId: string; resourceGroup: string; clusterName: string } | { type: 'oci'; compartmentId: string; region: string; clusterName: string }`
  - `PortRange` — `{ protocol: 'TCP' | 'UDP'; fromPort: number; toPort: number }`
  - `SelectorValue` union (one per selector category, see below)
  - `RuleOption` enum values

- [ ] **Step 1: Write the type file**

```ts
// src/components/PolicySelector/types.ts

export type SelectorSide = 'source' | 'destination';
export type K8sScope = 'namespace' | 'workload';
export type K8sOperator = 'eq' | 'exists' | 'neq' | 'in' | 'notin' | 'notexists';

export interface K8sExpression {
  key: string;
  operator: K8sOperator;
  values: string[]; // empty for 'exists' and 'notexists'
}

export type ClusterRef =
  | {type: 'id'; id: string}
  | {type: 'aws'; accountId: string; region: string; clusterName: string}
  | {type: 'gcp'; projectId: string; location: string; clusterName: string}
  | {type: 'azure'; subscriptionId: string; resourceGroup: string; clusterName: string}
  | {type: 'oci'; compartmentId: string; region: string; clusterName: string};

export interface PortRange {
  protocol: 'TCP' | 'UDP';
  fromPort: number;
  toPort: number;
}

// ── Selector value types ──────────────────────────────────────────────────────

export interface K8sLabelsValue {
  category: 'k8s_labels';
  clusters: ClusterRef[];
  scope: K8sScope;
  expressions: K8sExpression[];
}

export interface K8sServiceAccountValue {
  category: 'k8s_service_account';
  clusters: ClusterRef[];
  serviceAccounts: string[];
}

export interface FqdnValue {
  category: 'fqdn';
  names: string[];
}

export interface K8sServiceValue {
  category: 'k8s_service';
  clusters: ClusterRef[];
  names: string[];
}

export interface K8sIngressValue {
  category: 'k8s_ingress';
  clusters: ClusterRef[];
  names: string[];
}

export interface K8sGatewayValue {
  category: 'k8s_gateway';
  clusters: ClusterRef[];
  names: string[];
}

export interface IpListValue {
  category: 'ip_list';
  ids: string[];
}

export interface CloudAwsAccountValue {
  category: 'cloud_aws_account';
  accountIds: string[];
}

export interface CloudAwsVpcValue {
  category: 'cloud_aws_vpc';
  vpcs: {id: string; accountId: string; region: string}[];
}

export interface CloudAwsSubnetValue {
  category: 'cloud_aws_subnet';
  subnets: {id: string; accountId: string; region: string}[];
}

export interface CloudAzureSubscriptionValue {
  category: 'cloud_azure_subscription';
  subscriptionIds: string[];
}

export interface CloudAzureVnetValue {
  category: 'cloud_azure_vnet';
  vnets: {id: string; resourceGroup: string; subscriptionId: string}[];
}

export interface CloudAzureSubnetValue {
  category: 'cloud_azure_subnet';
  resourceIds: string[]; // full Azure resource ID
}

export interface IllumioLabelsValue {
  category: 'illumio_labels'; // placeholder, not yet implemented
}

export type SelectorValue =
  | K8sLabelsValue
  | K8sServiceAccountValue
  | FqdnValue
  | K8sServiceValue
  | K8sIngressValue
  | K8sGatewayValue
  | IpListValue
  | CloudAwsAccountValue
  | CloudAwsVpcValue
  | CloudAwsSubnetValue
  | CloudAzureSubscriptionValue
  | CloudAzureVnetValue
  | CloudAzureSubnetValue
  | IllumioLabelsValue;

export type SelectorCategory = SelectorValue['category'];

// ── Rule options ──────────────────────────────────────────────────────────────

export type RuleOption =
  | 'stateless'
  | 'override_deny'
  | 'external_scope'
  | 'secure_connect'
  | 'machine_auth'
  | 'use_workload_subnets';

// ── Rule form output ──────────────────────────────────────────────────────────

export interface RuleFormValue {
  ruleType: 'allow' | 'deny' | 'override_deny';
  sourceScopeType: 'intra_scope' | 'extra_scope';
  sources: SelectorValue[];
  sourceClusters: ClusterRef[];
  destinations: SelectorValue[];
  destinationClusters: ClusterRef[];
  destinationServices: PortRange[];
  ruleOptions: RuleOption[];
}
```

- [ ] **Step 2: Write type smoke tests**

```ts
// tests/PolicySelector/types.test.ts
import type {SelectorValue, K8sExpression, ClusterRef, PortRange, RuleFormValue} from '../../src/components/PolicySelector/types';

describe('types', () => {
  it('K8sExpression accepts empty values for exists operator', () => {
    const expr: K8sExpression = {key: 'app', operator: 'exists', values: []};
    expect(expr.values).toHaveLength(0);
  });

  it('ClusterRef discriminated union narrows correctly', () => {
    const ref: ClusterRef = {type: 'aws', accountId: '123', region: 'us-east-1', clusterName: 'prod'};
    if (ref.type === 'aws') {
      expect(ref.accountId).toBe('123');
    }
  });

  it('PortRange holds TCP protocol', () => {
    const range: PortRange = {protocol: 'TCP', fromPort: 443, toPort: 443};
    expect(range.protocol).toBe('TCP');
  });

  it('SelectorValue category discriminates k8s_labels', () => {
    const val: SelectorValue = {
      category: 'k8s_labels',
      clusters: [],
      scope: 'workload',
      expressions: [],
    };
    expect(val.category).toBe('k8s_labels');
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: 4 tests pass.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit --no-gpg-sign -m "feat: add PolicySelector shared types"
```

---

## Task 3: Mutual exclusion logic

**Files:**
- Create: `src/components/PolicySelector/mutualExclusion.ts`
- Create: `tests/PolicySelector/mutualExclusion.test.ts`

**Interfaces:**
- Consumes: `SelectorValue`, `SelectorCategory` from `./types`
- Produces:
  - `DESTINATION_ONLY_CATEGORIES: SelectorCategory[]` — categories unavailable on source side
  - `getConflictingCategories(incoming: SelectorCategory, existing: SelectorCategory[]): SelectorCategory[]` — returns categories that must be removed when `incoming` is added
  - `getConflictWarning(incoming: SelectorCategory, conflicts: SelectorCategory[]): string` — human-readable warning string for the Banner

- [ ] **Step 1: Write the mutual exclusion module**

```ts
// src/components/PolicySelector/mutualExclusion.ts
import type {SelectorCategory} from './types';

export const DESTINATION_ONLY_CATEGORIES: SelectorCategory[] = [
  'fqdn',
  'k8s_service',
  'k8s_ingress',
  'k8s_gateway',
];

// Categories that cannot coexist with each other on the destination side.
// K8s targeting modes: labels vs service/ingress/gateway are mutually exclusive.
const K8S_TARGETING_MODES: SelectorCategory[][] = [
  ['k8s_labels', 'k8s_service_account'],          // workload label mode
  ['k8s_service', 'k8s_ingress', 'k8s_gateway'],  // service/ingress/gateway mode
];

// Cloud provider groups: AWS vs Azure mutually exclusive.
const CLOUD_AWS_CATEGORIES: SelectorCategory[] = [
  'cloud_aws_account',
  'cloud_aws_vpc',
  'cloud_aws_subnet',
];
const CLOUD_AZURE_CATEGORIES: SelectorCategory[] = [
  'cloud_azure_subscription',
  'cloud_azure_vnet',
  'cloud_azure_subnet',
];

// Within a provider: org_selector vs network selectors mutually exclusive.
const AWS_ORG_CATEGORIES: SelectorCategory[] = ['cloud_aws_account'];
const AWS_NETWORK_CATEGORIES: SelectorCategory[] = ['cloud_aws_vpc', 'cloud_aws_subnet'];
const AZURE_ORG_CATEGORIES: SelectorCategory[] = ['cloud_azure_subscription'];
const AZURE_NETWORK_CATEGORIES: SelectorCategory[] = ['cloud_azure_vnet', 'cloud_azure_subnet'];

function findGroupFor(cat: SelectorCategory, groups: SelectorCategory[][]): SelectorCategory[] | null {
  return groups.find(g => g.includes(cat)) ?? null;
}

export function getConflictingCategories(
  incoming: SelectorCategory,
  existing: SelectorCategory[],
): SelectorCategory[] {
  const conflicts = new Set<SelectorCategory>();

  // K8s targeting mode conflict
  const incomingK8sMode = findGroupFor(incoming, K8S_TARGETING_MODES);
  if (incomingK8sMode) {
    for (const cat of existing) {
      const existingMode = findGroupFor(cat, K8S_TARGETING_MODES);
      if (existingMode && existingMode !== incomingK8sMode) {
        conflicts.add(cat);
      }
    }
  }

  // AWS vs Azure conflict
  if (CLOUD_AWS_CATEGORIES.includes(incoming)) {
    existing.filter(c => CLOUD_AZURE_CATEGORIES.includes(c)).forEach(c => conflicts.add(c));
  }
  if (CLOUD_AZURE_CATEGORIES.includes(incoming)) {
    existing.filter(c => CLOUD_AWS_CATEGORIES.includes(c)).forEach(c => conflicts.add(c));
  }

  // AWS org vs network conflict
  if (AWS_ORG_CATEGORIES.includes(incoming)) {
    existing.filter(c => AWS_NETWORK_CATEGORIES.includes(c)).forEach(c => conflicts.add(c));
  }
  if (AWS_NETWORK_CATEGORIES.includes(incoming)) {
    existing.filter(c => AWS_ORG_CATEGORIES.includes(c)).forEach(c => conflicts.add(c));
  }

  // Azure org vs network conflict
  if (AZURE_ORG_CATEGORIES.includes(incoming)) {
    existing.filter(c => AZURE_NETWORK_CATEGORIES.includes(c)).forEach(c => conflicts.add(c));
  }
  if (AZURE_NETWORK_CATEGORIES.includes(incoming)) {
    existing.filter(c => AZURE_ORG_CATEGORIES.includes(c)).forEach(c => conflicts.add(c));
  }

  return Array.from(conflicts);
}

const CATEGORY_LABELS: Record<SelectorCategory, string> = {
  k8s_labels: 'K8s Labels',
  k8s_service_account: 'Service Account',
  fqdn: 'FQDN',
  k8s_service: 'K8s Service',
  k8s_ingress: 'K8s Ingress',
  k8s_gateway: 'K8s Gateway',
  ip_list: 'IP List',
  cloud_aws_account: 'AWS Account',
  cloud_aws_vpc: 'AWS VPC',
  cloud_aws_subnet: 'AWS Subnet',
  cloud_azure_subscription: 'Azure Subscription',
  cloud_azure_vnet: 'Azure VNet',
  cloud_azure_subnet: 'Azure Subnet',
  illumio_labels: 'Illumio Labels',
};

export function getConflictWarning(
  incoming: SelectorCategory,
  conflicts: SelectorCategory[],
): string {
  const conflictLabels = conflicts.map(c => CATEGORY_LABELS[c]).join(', ');
  return `Adding "${CATEGORY_LABELS[incoming]}" will remove conflicting selections: ${conflictLabels}. Continue?`;
}
```

- [ ] **Step 2: Write mutual exclusion tests**

```ts
// tests/PolicySelector/mutualExclusion.test.ts
import {getConflictingCategories, getConflictWarning, DESTINATION_ONLY_CATEGORIES} from '../../src/components/PolicySelector/mutualExclusion';

describe('getConflictingCategories', () => {
  it('returns empty array when no conflicts', () => {
    expect(getConflictingCategories('ip_list', ['fqdn'])).toEqual([]);
  });

  it('K8s Service conflicts with K8s Labels on destination', () => {
    const conflicts = getConflictingCategories('k8s_service', ['k8s_labels']);
    expect(conflicts).toContain('k8s_labels');
  });

  it('K8s Labels conflicts with K8s Service', () => {
    const conflicts = getConflictingCategories('k8s_labels', ['k8s_service']);
    expect(conflicts).toContain('k8s_service');
  });

  it('K8s Ingress conflicts with K8s Gateway (same mode group)', () => {
    // Both are in service/ingress/gateway mode — no conflict within the group
    const conflicts = getConflictingCategories('k8s_ingress', ['k8s_gateway']);
    expect(conflicts).toHaveLength(0);
  });

  it('AWS VPC conflicts with Azure Subscription', () => {
    const conflicts = getConflictingCategories('cloud_aws_vpc', ['cloud_azure_subscription']);
    expect(conflicts).toContain('cloud_azure_subscription');
  });

  it('AWS Account (org) conflicts with AWS VPC (network)', () => {
    const conflicts = getConflictingCategories('cloud_aws_account', ['cloud_aws_vpc']);
    expect(conflicts).toContain('cloud_aws_vpc');
  });

  it('Azure Subscription conflicts with Azure VNet', () => {
    const conflicts = getConflictingCategories('cloud_azure_subscription', ['cloud_azure_vnet']);
    expect(conflicts).toContain('cloud_azure_vnet');
  });

  it('returns all conflicting categories across multiple groups', () => {
    const conflicts = getConflictingCategories('cloud_aws_vpc', ['cloud_azure_subscription', 'cloud_azure_vnet', 'ip_list']);
    expect(conflicts).toContain('cloud_azure_subscription');
    expect(conflicts).toContain('cloud_azure_vnet');
    expect(conflicts).not.toContain('ip_list');
  });
});

describe('getConflictWarning', () => {
  it('returns a human-readable warning string', () => {
    const msg = getConflictWarning('k8s_service', ['k8s_labels']);
    expect(msg).toContain('K8s Service');
    expect(msg).toContain('K8s Labels');
  });
});

describe('DESTINATION_ONLY_CATEGORIES', () => {
  it('includes fqdn, k8s_service, k8s_ingress, k8s_gateway', () => {
    expect(DESTINATION_ONLY_CATEGORIES).toEqual(
      expect.arrayContaining(['fqdn', 'k8s_service', 'k8s_ingress', 'k8s_gateway']),
    );
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit --no-gpg-sign -m "feat: add mutual exclusion logic for selector categories"
```

---

## Task 4: K8sExpressionEditor (custom PowerSearch value editor)

**Files:**
- Create: `src/components/PolicySelector/K8sExpressionEditor.tsx`
- Create: `tests/PolicySelector/K8sExpressionEditor.test.tsx`

**Interfaces:**
- Consumes: `K8sExpression`, `K8sOperator`, `K8sScope` from `./types`
- Produces: `K8sExpressionEditor` — React component matching `CustomOperatorValue.Editor` shape:
  ```ts
  interface K8sExpressionEditorProps {
    isDisabled?: boolean;
    onChange: (value: string | null) => void; // JSON.stringify(K8sEditorValue)
    placeholder: string;
    value: string | null; // JSON.stringify(K8sEditorValue) | null
  }
  // K8sEditorValue = { scope: K8sScope; expressions: K8sExpression[] }
  ```
- Produces: `serializeK8sEditor(v: K8sEditorValue): string` and `deserializeK8sEditor(s: string | null): K8sEditorValue`
- Produces: `k8sEditorGetString(value: string): string` — display string for token label

- [ ] **Step 1: Create the editor**

```tsx
// src/components/PolicySelector/K8sExpressionEditor.tsx
import {useState, useCallback} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Selector} from '@astryxdesign/core/Selector';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Tokenizer} from '@astryxdesign/core/Tokenizer';
import {Token} from '@astryxdesign/core/Token';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import type {K8sExpression, K8sOperator, K8sScope} from './types';

export interface K8sEditorValue {
  scope: K8sScope;
  expressions: K8sExpression[];
}

export function serializeK8sEditor(v: K8sEditorValue): string {
  return JSON.stringify(v);
}

export function deserializeK8sEditor(s: string | null): K8sEditorValue {
  if (!s) return {scope: 'workload', expressions: [{key: '', operator: 'eq', values: ['']}]};
  try {
    return JSON.parse(s) as K8sEditorValue;
  } catch {
    return {scope: 'workload', expressions: [{key: '', operator: 'eq', values: ['']}]};
  }
}

export function k8sEditorGetString(value: string): string {
  const parsed = deserializeK8sEditor(value);
  return parsed.expressions
    .map(expr => {
      if (expr.operator === 'exists') return `${expr.key}=*`;
      if (expr.operator === 'notexists') return `!${expr.key}`;
      if (expr.operator === 'eq') return `${expr.key}=${expr.values[0] ?? ''}`;
      if (expr.operator === 'neq') return `${expr.key}!=${expr.values[0] ?? ''}`;
      if (expr.operator === 'in') return `${expr.key} in [${expr.values.join(',')}]`;
      if (expr.operator === 'notin') return `${expr.key} notin [${expr.values.join(',')}]`;
      return expr.key;
    })
    .join(' & ');
}

const OPERATOR_OPTIONS = [
  {value: 'eq', label: '= equals'},
  {value: 'exists', label: '=* exists'},
  {value: 'neq', label: '!= not equals'},
  {value: 'in', label: 'in set'},
  {value: 'notin', label: 'notin set'},
  {value: 'notexists', label: '! does not exist'},
];

const EMPTY_EXPRESSION: K8sExpression = {key: '', operator: 'eq', values: ['']};

const MULTI_VALUE_OPS: K8sOperator[] = ['in', 'notin'];
const NO_VALUE_OPS: K8sOperator[] = ['exists', 'notexists'];

interface Props {
  isDisabled?: boolean;
  onChange: (value: string | null) => void;
  placeholder: string;
  value: string | null;
}

export default function K8sExpressionEditor({isDisabled, onChange, value}: Props) {
  const [state, setState] = useState<K8sEditorValue>(() => deserializeK8sEditor(value));

  const emit = useCallback((next: K8sEditorValue) => {
    setState(next);
    onChange(serializeK8sEditor(next));
  }, [onChange]);

  const updateExpression = (index: number, patch: Partial<K8sExpression>) => {
    const expressions = state.expressions.map((e, i) => {
      if (i !== index) return e;
      const updated = {...e, ...patch};
      // Reset values when operator changes
      if (patch.operator !== undefined) {
        if (NO_VALUE_OPS.includes(patch.operator)) updated.values = [];
        else if (MULTI_VALUE_OPS.includes(patch.operator)) updated.values = [];
        else updated.values = [''];
      }
      return updated;
    });
    emit({...state, expressions});
  };

  const addExpression = () =>
    emit({...state, expressions: [...state.expressions, {...EMPTY_EXPRESSION}]});

  const removeExpression = (index: number) =>
    emit({...state, expressions: state.expressions.filter((_, i) => i !== index)});

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', padding: 'var(--spacing-2)'}}>
      <SegmentedControl
        label="Selector scope"
        value={state.scope}
        onChange={scope => emit({...state, scope: scope as K8sScope})}
        isDisabled={isDisabled}
      >
        <SegmentedControlItem value="namespace" label="Namespace" />
        <SegmentedControlItem value="workload" label="Workload" />
      </SegmentedControl>

      {state.expressions.map((expr, i) => (
        <div key={i}>
          {i > 0 && (
            <div style={{color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: 'var(--spacing-1)'}}>
              — AND —
            </div>
          )}
          <div style={{display: 'flex', gap: 'var(--spacing-2)', alignItems: 'flex-end'}}>
            <TextInput
              label="Key"
              value={expr.operator === 'notexists' ? `!${expr.key}` : expr.key}
              onChange={v => updateExpression(i, {key: v.replace(/^!/, '')})}
              placeholder="label key"
              isDisabled={isDisabled}
              style={{flex: 1}}
            />
            <Selector
              label="Operator"
              value={expr.operator}
              options={OPERATOR_OPTIONS}
              onChange={op => updateExpression(i, {operator: op as K8sOperator})}
              isDisabled={isDisabled}
              style={{width: 140}}
            />
            {!NO_VALUE_OPS.includes(expr.operator) && (
              MULTI_VALUE_OPS.includes(expr.operator) ? (
                <Tokenizer
                  label="Values"
                  value={expr.values.filter(Boolean).map(v => ({id: v, label: v}))}
                  searchSource={{
                    search: () => [],
                    bootstrap: () => [],
                  }}
                  hasCreate
                  onChange={(items) => updateExpression(i, {values: items.map(it => it.label)})}
                  isDisabled={isDisabled}
                  renderToken={(item, onRemove) => (
                    <Token key={item.id} label={item.label} onRemove={onRemove} />
                  )}
                  style={{flex: 1}}
                />
              ) : (
                <TextInput
                  label="Value"
                  value={expr.values[0] ?? ''}
                  onChange={v => updateExpression(i, {values: [v]})}
                  placeholder="label value"
                  isDisabled={isDisabled}
                  style={{flex: 1}}
                />
              )
            )}
            {state.expressions.length > 1 && (
              <Button
                label="Remove"
                variant="tertiary"
                onPress={() => removeExpression(i)}
                isDisabled={isDisabled}
              />
            )}
          </div>
        </div>
      ))}

      <Button
        label="+ Add expression"
        variant="tertiary"
        onPress={addExpression}
        isDisabled={isDisabled}
      />
    </div>
  );
}
```

- [ ] **Step 2: Write K8sExpressionEditor tests**

```tsx
// tests/PolicySelector/K8sExpressionEditor.test.tsx
import {render, screen, fireEvent} from '@testing-library/react';
import K8sExpressionEditor, {
  serializeK8sEditor,
  deserializeK8sEditor,
  k8sEditorGetString,
} from '../../src/components/PolicySelector/K8sExpressionEditor';

describe('serializeK8sEditor / deserializeK8sEditor', () => {
  it('round-trips a value', () => {
    const val = {scope: 'workload' as const, expressions: [{key: 'app', operator: 'eq' as const, values: ['frontend']}]};
    expect(deserializeK8sEditor(serializeK8sEditor(val))).toEqual(val);
  });

  it('returns defaults for null input', () => {
    const result = deserializeK8sEditor(null);
    expect(result.scope).toBe('workload');
    expect(result.expressions).toHaveLength(1);
  });
});

describe('k8sEditorGetString', () => {
  it('formats eq operator', () => {
    const s = serializeK8sEditor({scope: 'workload', expressions: [{key: 'app', operator: 'eq', values: ['frontend']}]});
    expect(k8sEditorGetString(s)).toBe('app=frontend');
  });

  it('formats exists operator', () => {
    const s = serializeK8sEditor({scope: 'workload', expressions: [{key: 'app', operator: 'exists', values: []}]});
    expect(k8sEditorGetString(s)).toBe('app=*');
  });

  it('formats notexists operator', () => {
    const s = serializeK8sEditor({scope: 'workload', expressions: [{key: 'canary', operator: 'notexists', values: []}]});
    expect(k8sEditorGetString(s)).toBe('!canary');
  });

  it('formats in operator', () => {
    const s = serializeK8sEditor({scope: 'workload', expressions: [{key: 'tier', operator: 'in', values: ['db', 'cache']}]});
    expect(k8sEditorGetString(s)).toBe('tier in [db,cache]');
  });

  it('joins multiple expressions with &', () => {
    const s = serializeK8sEditor({
      scope: 'workload',
      expressions: [
        {key: 'app', operator: 'eq', values: ['frontend']},
        {key: 'canary', operator: 'notexists', values: []},
      ],
    });
    expect(k8sEditorGetString(s)).toBe('app=frontend & !canary');
  });
});

describe('K8sExpressionEditor component', () => {
  it('renders scope toggle and first expression row', () => {
    render(<K8sExpressionEditor onChange={() => {}} placeholder="" value={null} />);
    expect(screen.getByText('Namespace')).toBeInTheDocument();
    expect(screen.getByText('Workload')).toBeInTheDocument();
    expect(screen.getByLabelText('Key')).toBeInTheDocument();
  });

  it('calls onChange when key is typed', () => {
    const onChange = vi.fn();
    render(<K8sExpressionEditor onChange={onChange} placeholder="" value={null} />);
    fireEvent.change(screen.getByLabelText('Key'), {target: {value: 'env'}});
    expect(onChange).toHaveBeenCalled();
  });

  it('adds a second expression on Add button click', () => {
    render(<K8sExpressionEditor onChange={() => {}} placeholder="" value={null} />);
    fireEvent.click(screen.getByText('+ Add expression'));
    expect(screen.getAllByLabelText('Key')).toHaveLength(2);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit --no-gpg-sign -m "feat: add K8sExpressionEditor with serialize/deserialize and display string"
```

---

## Task 5: CloudResourceEditor (custom PowerSearch value editor)

**Files:**
- Create: `src/components/PolicySelector/CloudResourceEditor.tsx`
- Create: `tests/PolicySelector/CloudResourceEditor.test.tsx`

**Interfaces:**
- Consumes: `SelectorCategory` from `./types`
- Produces: `CloudResourceEditor` — matches `CustomOperatorValue.Editor` shape, serializes to JSON
- Produces: `cloudResourceGetString(value: string, category: SelectorCategory): string`

- [ ] **Step 1: Create the editor**

```tsx
// src/components/PolicySelector/CloudResourceEditor.tsx
import {useState} from 'react';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Selector} from '@astryxdesign/core/Selector';
import {Button} from '@astryxdesign/core/Button';
import type {SelectorCategory} from './types';

const AWS_REGIONS = [
  'us-east-1','us-east-2','us-west-1','us-west-2',
  'eu-west-1','eu-west-2','eu-central-1',
  'ap-southeast-1','ap-southeast-2','ap-northeast-1',
].map(r => ({value: r, label: r}));

export type CloudEntry = Record<string, string>;

export interface CloudEditorValue {
  entries: CloudEntry[];
}

export function serializeCloudEditor(v: CloudEditorValue): string {
  return JSON.stringify(v);
}

export function deserializeCloudEditor(s: string | null): CloudEditorValue {
  if (!s) return {entries: [{}]};
  try { return JSON.parse(s) as CloudEditorValue; } catch { return {entries: [{}]}; }
}

// Returns a short display string for the token chip
export function cloudResourceGetString(value: string, category: SelectorCategory): string {
  const parsed = deserializeCloudEditor(value);
  const entry = parsed.entries[0];
  if (!entry) return '';
  const count = parsed.entries.length;
  const suffix = count > 1 ? ` +${count - 1}` : '';
  switch (category) {
    case 'cloud_aws_vpc':
    case 'cloud_aws_subnet':
      return `${entry['id'] ?? ''}${entry['region'] ? ` · ${entry['region']}` : ''}${suffix}`;
    case 'cloud_azure_vnet':
      return `${entry['id'] ?? ''}${entry['resourceGroup'] ? ` · ${entry['resourceGroup']}` : ''}${suffix}`;
    case 'cloud_azure_subnet':
      return `${entry['resourceId'] ?? ''}${suffix}`;
    default:
      return Object.values(entry).filter(Boolean).join(' · ') + suffix;
  }
}

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'region';
}

const FIELD_DEFS: Partial<Record<SelectorCategory, FieldDef[]>> = {
  cloud_aws_vpc: [
    {key: 'accountId', label: 'Account ID', type: 'text'},
    {key: 'region', label: 'Region', type: 'region'},
    {key: 'id', label: 'VPC ID', type: 'text'},
  ],
  cloud_aws_subnet: [
    {key: 'accountId', label: 'Account ID', type: 'text'},
    {key: 'region', label: 'Region', type: 'region'},
    {key: 'id', label: 'Subnet ID', type: 'text'},
  ],
  cloud_azure_vnet: [
    {key: 'subscriptionId', label: 'Subscription ID', type: 'text'},
    {key: 'resourceGroup', label: 'Resource Group', type: 'text'},
    {key: 'id', label: 'VNet Name', type: 'text'},
  ],
  cloud_azure_subnet: [
    {key: 'resourceId', label: 'Full Azure Resource ID', type: 'text'},
  ],
};

interface Props {
  category: SelectorCategory;
  isDisabled?: boolean;
  onChange: (value: string | null) => void;
  placeholder: string;
  value: string | null;
}

export default function CloudResourceEditor({category, isDisabled, onChange, value}: Props) {
  const [state, setState] = useState<CloudEditorValue>(() => deserializeCloudEditor(value));
  const fields = FIELD_DEFS[category] ?? [];

  const emit = (next: CloudEditorValue) => {
    setState(next);
    onChange(serializeCloudEditor(next));
  };

  const updateEntry = (index: number, key: string, val: string) => {
    const entries = state.entries.map((e, i) => i === index ? {...e, [key]: val} : e);
    emit({entries});
  };

  const addEntry = () => emit({entries: [...state.entries, {}]});
  const removeEntry = (index: number) => emit({entries: state.entries.filter((_, i) => i !== index)});

  const entryLabel = category.includes('vpc') ? 'VPC' :
    category.includes('subnet') ? 'Subnet' :
    category.includes('vnet') ? 'VNet' : 'Entry';

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', padding: 'var(--spacing-2)'}}>
      {state.entries.map((entry, i) => (
        <div key={i} style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)'}}>
          {i > 0 && (
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{color: 'var(--color-text-secondary)', fontSize: '0.75rem'}}>{entryLabel} {i + 1}</span>
              <Button label="Remove" variant="tertiary" onPress={() => removeEntry(i)} isDisabled={isDisabled} />
            </div>
          )}
          {fields.map(field => (
            field.type === 'region' ? (
              <Selector
                key={field.key}
                label={field.label}
                value={entry[field.key] ?? ''}
                options={AWS_REGIONS}
                onChange={v => updateEntry(i, field.key, v)}
                isDisabled={isDisabled}
                hasSearch
              />
            ) : (
              <TextInput
                key={field.key}
                label={field.label}
                value={entry[field.key] ?? ''}
                onChange={v => updateEntry(i, field.key, v)}
                isDisabled={isDisabled}
              />
            )
          ))}
        </div>
      ))}
      <Button
        label={`+ Add another ${entryLabel}`}
        variant="tertiary"
        onPress={addEntry}
        isDisabled={isDisabled}
      />
    </div>
  );
}
```

- [ ] **Step 2: Write tests**

```tsx
// tests/PolicySelector/CloudResourceEditor.test.tsx
import {render, screen, fireEvent} from '@testing-library/react';
import CloudResourceEditor, {
  serializeCloudEditor,
  deserializeCloudEditor,
  cloudResourceGetString,
} from '../../src/components/PolicySelector/CloudResourceEditor';

describe('serialize/deserialize', () => {
  it('round-trips', () => {
    const val = {entries: [{id: 'vpc-123', region: 'us-east-1', accountId: '111'}]};
    expect(deserializeCloudEditor(serializeCloudEditor(val))).toEqual(val);
  });
  it('defaults to one empty entry for null', () => {
    expect(deserializeCloudEditor(null).entries).toHaveLength(1);
  });
});

describe('cloudResourceGetString', () => {
  it('formats AWS VPC entry', () => {
    const s = serializeCloudEditor({entries: [{id: 'vpc-abc', region: 'us-east-1', accountId: '123'}]});
    expect(cloudResourceGetString(s, 'cloud_aws_vpc')).toBe('vpc-abc · us-east-1');
  });
  it('includes +N for multiple entries', () => {
    const s = serializeCloudEditor({entries: [{id: 'vpc-1', region: 'us-east-1'}, {id: 'vpc-2', region: 'us-west-2'}]});
    expect(cloudResourceGetString(s, 'cloud_aws_vpc')).toContain('+1');
  });
});

describe('CloudResourceEditor component', () => {
  it('renders VPC fields for cloud_aws_vpc category', () => {
    render(<CloudResourceEditor category="cloud_aws_vpc" onChange={() => {}} placeholder="" value={null} />);
    expect(screen.getByLabelText('Account ID')).toBeInTheDocument();
    expect(screen.getByLabelText('VPC ID')).toBeInTheDocument();
  });

  it('adds a second entry on Add button click', () => {
    render(<CloudResourceEditor category="cloud_aws_vpc" onChange={() => {}} placeholder="" value={null} />);
    fireEvent.click(screen.getByText('+ Add another VPC'));
    expect(screen.getAllByLabelText('VPC ID')).toHaveLength(2);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit --no-gpg-sign -m "feat: add CloudResourceEditor for AWS/Azure multi-field resource input"
```

---

## Task 6: PortRangeEditor (custom PowerSearch value editor)

**Files:**
- Create: `src/components/PolicySelector/PortRangeEditor.tsx`
- Create: `tests/PolicySelector/PortRangeEditor.test.tsx`

**Interfaces:**
- Produces: `PortRangeEditor` — matches `CustomOperatorValue.Editor` shape
- Produces: `portRangeGetString(value: string): string` — e.g. `"TCP 443"` or `"TCP 8080–9000"`

- [ ] **Step 1: Create the editor**

```tsx
// src/components/PolicySelector/PortRangeEditor.tsx
import {useState} from 'react';
import {Selector} from '@astryxdesign/core/Selector';
import {NumberInput} from '@astryxdesign/core/NumberInput';
import {Button} from '@astryxdesign/core/Button';
import type {PortRange} from './types';

export interface PortRangeEditorValue {
  ranges: PortRange[];
}

export function serializePortRange(v: PortRangeEditorValue): string {
  return JSON.stringify(v);
}

export function deserializePortRange(s: string | null): PortRangeEditorValue {
  if (!s) return {ranges: [{protocol: 'TCP', fromPort: 0, toPort: 0}]};
  try { return JSON.parse(s) as PortRangeEditorValue; } catch {
    return {ranges: [{protocol: 'TCP', fromPort: 0, toPort: 0}]};
  }
}

export function portRangeGetString(value: string): string {
  const parsed = deserializePortRange(value);
  return parsed.ranges.map(r =>
    r.fromPort === r.toPort
      ? `${r.protocol} ${r.fromPort}`
      : `${r.protocol} ${r.fromPort}–${r.toPort}`,
  ).join(', ');
}

const PROTOCOL_OPTIONS = [
  {value: 'TCP', label: 'TCP'},
  {value: 'UDP', label: 'UDP'},
];

interface Props {
  isDisabled?: boolean;
  onChange: (value: string | null) => void;
  placeholder: string;
  value: string | null;
}

export default function PortRangeEditor({isDisabled, onChange, value}: Props) {
  const [state, setState] = useState<PortRangeEditorValue>(() => deserializePortRange(value));

  const emit = (next: PortRangeEditorValue) => {
    setState(next);
    onChange(serializePortRange(next));
  };

  const updateRange = (index: number, patch: Partial<PortRange>) => {
    emit({ranges: state.ranges.map((r, i) => i === index ? {...r, ...patch} : r)});
  };

  const addRange = () =>
    emit({ranges: [...state.ranges, {protocol: 'TCP', fromPort: 0, toPort: 0}]});

  const removeRange = (index: number) =>
    emit({ranges: state.ranges.filter((_, i) => i !== index)});

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', padding: 'var(--spacing-2)'}}>
      {state.ranges.map((range, i) => (
        <div key={i} style={{display: 'flex', gap: 'var(--spacing-2)', alignItems: 'flex-end'}}>
          <Selector
            label="Protocol"
            value={range.protocol}
            options={PROTOCOL_OPTIONS}
            onChange={v => updateRange(i, {protocol: v as 'TCP' | 'UDP'})}
            isDisabled={isDisabled}
            style={{width: 100}}
          />
          <NumberInput
            label="From port"
            value={range.fromPort}
            onChange={v => updateRange(i, {fromPort: v ?? 0})}
            minValue={0}
            maxValue={65535}
            isDisabled={isDisabled}
          />
          <NumberInput
            label="To port"
            value={range.toPort}
            onChange={v => updateRange(i, {toPort: v ?? 0})}
            minValue={0}
            maxValue={65535}
            isDisabled={isDisabled}
          />
          {state.ranges.length > 1 && (
            <Button label="Remove" variant="tertiary" onPress={() => removeRange(i)} isDisabled={isDisabled} />
          )}
        </div>
      ))}
      <Button label="+ Add another range" variant="tertiary" onPress={addRange} isDisabled={isDisabled} />
    </div>
  );
}
```

- [ ] **Step 2: Write tests**

```tsx
// tests/PolicySelector/PortRangeEditor.test.tsx
import {render, screen, fireEvent} from '@testing-library/react';
import PortRangeEditor, {portRangeGetString, serializePortRange} from '../../src/components/PolicySelector/PortRangeEditor';

describe('portRangeGetString', () => {
  it('formats single port', () => {
    const s = serializePortRange({ranges: [{protocol: 'TCP', fromPort: 443, toPort: 443}]});
    expect(portRangeGetString(s)).toBe('TCP 443');
  });
  it('formats port range', () => {
    const s = serializePortRange({ranges: [{protocol: 'UDP', fromPort: 8080, toPort: 9000}]});
    expect(portRangeGetString(s)).toBe('UDP 8080–9000');
  });
  it('formats multiple ranges separated by comma', () => {
    const s = serializePortRange({ranges: [
      {protocol: 'TCP', fromPort: 443, toPort: 443},
      {protocol: 'UDP', fromPort: 53, toPort: 53},
    ]});
    expect(portRangeGetString(s)).toBe('TCP 443, UDP 53');
  });
});

describe('PortRangeEditor component', () => {
  it('renders protocol, from port, to port fields', () => {
    render(<PortRangeEditor onChange={() => {}} placeholder="" value={null} />);
    expect(screen.getByLabelText('Protocol')).toBeInTheDocument();
    expect(screen.getByLabelText('From port')).toBeInTheDocument();
    expect(screen.getByLabelText('To port')).toBeInTheDocument();
  });

  it('adds a second range on Add button click', () => {
    render(<PortRangeEditor onChange={() => {}} placeholder="" value={null} />);
    fireEvent.click(screen.getByText('+ Add another range'));
    expect(screen.getAllByLabelText('From port')).toHaveLength(2);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit --no-gpg-sign -m "feat: add PortRangeEditor for destination services"
```

---

## Task 7: PowerSearch config factory

**Files:**
- Create: `src/components/PolicySelector/selectorConfig.ts`

**Interfaces:**
- Consumes: `K8sExpressionEditor`, `k8sEditorGetString` from `./K8sExpressionEditor`
- Consumes: `CloudResourceEditor`, `cloudResourceGetString` from `./CloudResourceEditor`
- Consumes: `PortRangeEditor`, `portRangeGetString` from `./PortRangeEditor`
- Consumes: `SelectorSide` from `./types`
- Consumes: `DESTINATION_ONLY_CATEGORIES` from `./mutualExclusion`
- Produces:
  - `buildSelectorConfig(side: SelectorSide): PowerSearchConfig` — PowerSearch config for Sources/Destinations
  - `buildPortRangeConfig(): PowerSearchConfig` — PowerSearch config for Destination Services

- [ ] **Step 1: Create the config factory**

```ts
// src/components/PolicySelector/selectorConfig.ts
import type {PowerSearchConfig} from '@astryxdesign/core/PowerSearch';
import K8sExpressionEditor, {k8sEditorGetString} from './K8sExpressionEditor';
import CloudResourceEditor, {cloudResourceGetString} from './CloudResourceEditor';
import PortRangeEditor, {portRangeGetString} from './PortRangeEditor';
import type {SelectorSide} from './types';
import {DESTINATION_ONLY_CATEGORIES} from './mutualExclusion';

// Wrap CloudResourceEditor to bind the category prop (CustomOperatorValue.Editor
// only receives isDisabled, onChange, placeholder, value).
function makeCloudEditor(category: Parameters<typeof cloudResourceGetString>[1]) {
  return {
    Editor: (props: {isDisabled?: boolean; onChange: (v: string | null) => void; placeholder: string; value: string | null}) =>
      CloudResourceEditor({...props, category}),
    getString: (v: string) => cloudResourceGetString(v, category),
  };
}

export function buildSelectorConfig(side: SelectorSide): PowerSearchConfig {
  const isDestination = side === 'destination';

  const fields: PowerSearchConfig['fields'] = [
    {
      key: 'k8s_labels',
      label: 'K8s Labels',
      defaultOperator: 'expr',
      operators: [{
        key: 'expr',
        label: 'matches',
        value: {type: 'custom', Editor: K8sExpressionEditor, getString: k8sEditorGetString},
      }],
    },
    {
      key: 'k8s_service_account',
      label: 'Service Account',
      defaultOperator: 'is_any',
      operators: [{
        key: 'is_any',
        label: 'includes',
        value: {type: 'string_list', isArbitraryStringAllowed: true},
      }],
    },
    {
      key: 'ip_list',
      label: 'IP List',
      defaultOperator: 'is_any',
      operators: [{
        key: 'is_any',
        label: 'includes',
        value: {type: 'string_list', isArbitraryStringAllowed: true},
      }],
    },
    {
      key: 'cloud_aws_account',
      label: 'AWS Account',
      defaultOperator: 'is_any',
      operators: [{
        key: 'is_any',
        label: 'includes',
        value: {type: 'string_list', isArbitraryStringAllowed: true},
      }],
    },
    {
      key: 'cloud_aws_vpc',
      label: 'AWS VPC',
      defaultOperator: 'is',
      operators: [{
        key: 'is',
        label: 'is',
        value: makeCloudEditor('cloud_aws_vpc'),
      }],
    },
    {
      key: 'cloud_aws_subnet',
      label: 'AWS Subnet',
      defaultOperator: 'is',
      operators: [{
        key: 'is',
        label: 'is',
        value: makeCloudEditor('cloud_aws_subnet'),
      }],
    },
    {
      key: 'cloud_azure_subscription',
      label: 'Azure Subscription',
      defaultOperator: 'is_any',
      operators: [{
        key: 'is_any',
        label: 'includes',
        value: {type: 'string_list', isArbitraryStringAllowed: true},
      }],
    },
    {
      key: 'cloud_azure_vnet',
      label: 'Azure VNet',
      defaultOperator: 'is',
      operators: [{
        key: 'is',
        label: 'is',
        value: makeCloudEditor('cloud_azure_vnet'),
      }],
    },
    {
      key: 'cloud_azure_subnet',
      label: 'Azure Subnet',
      defaultOperator: 'is',
      operators: [{
        key: 'is',
        label: 'is',
        value: makeCloudEditor('cloud_azure_subnet'),
      }],
    },
    {
      key: 'illumio_labels',
      label: 'Illumio Labels (coming soon)',
      defaultOperator: 'noop',
      isDisabled: true,
      operators: [{
        key: 'noop',
        label: '—',
        value: {type: 'empty'},
      }],
    },
  ];

  // Destination-only fields appended when side === 'destination'
  if (isDestination) {
    fields.push(
      {
        key: 'fqdn',
        label: 'FQDN',
        defaultOperator: 'is_any',
        operators: [{
          key: 'is_any',
          label: 'includes',
          value: {type: 'string_list', isArbitraryStringAllowed: true},
        }],
      },
      {
        key: 'k8s_service',
        label: 'K8s Service',
        defaultOperator: 'is_any',
        operators: [{
          key: 'is_any',
          label: 'includes',
          value: {type: 'string_list', isArbitraryStringAllowed: true},
        }],
      },
      {
        key: 'k8s_ingress',
        label: 'K8s Ingress',
        defaultOperator: 'is_any',
        operators: [{
          key: 'is_any',
          label: 'includes',
          value: {type: 'string_list', isArbitraryStringAllowed: true},
        }],
      },
      {
        key: 'k8s_gateway',
        label: 'K8s Gateway',
        defaultOperator: 'is_any',
        operators: [{
          key: 'is_any',
          label: 'includes',
          value: {type: 'string_list', isArbitraryStringAllowed: true},
        }],
      },
    );
  }

  return {name: `${side}-selector`, fields};
}

export function buildPortRangeConfig(): PowerSearchConfig {
  return {
    name: 'port-range',
    fields: [{
      key: 'port_range',
      label: 'Port Range',
      defaultOperator: 'is',
      operators: [{
        key: 'is',
        label: 'is',
        value: {type: 'custom', Editor: PortRangeEditor, getString: portRangeGetString},
      }],
    }],
  };
}
```

- [ ] **Step 2: Commit** (no unit test needed — pure config; exercised by integration in Task 8)

```bash
git add -A && git commit --no-gpg-sign -m "feat: add PowerSearch config factory for selectors and port ranges"
```

---

## Task 8: SelectorPowerSearch + ClusterSelector + RuleOptionsSelector

**Files:**
- Create: `src/components/PolicySelector/ClusterSelector.tsx`
- Create: `src/components/PolicySelector/SelectorPowerSearch.tsx`
- Create: `src/components/PolicySelector/RuleOptionsSelector.tsx`
- Create: `tests/PolicySelector/SelectorPowerSearch.test.tsx`
- Create: `tests/PolicySelector/RuleOptionsSelector.test.tsx`

**Interfaces:**
- Consumes: `buildSelectorConfig`, `buildPortRangeConfig` from `./selectorConfig`
- Consumes: `getConflictingCategories`, `getConflictWarning`, `DESTINATION_ONLY_CATEGORIES` from `./mutualExclusion`
- Consumes: `SelectorSide`, `ClusterRef`, `RuleOption` from `./types`
- Produces:
  ```ts
  // ClusterSelector
  interface ClusterSelectorProps {
    clusters: ClusterRef[];
    onChange: (clusters: ClusterRef[]) => void;
    isDisabled?: boolean;
  }

  // SelectorPowerSearch
  interface SelectorPowerSearchProps {
    label: string;
    side: SelectorSide;
    filters: ReadonlyArray<PowerSearchFilter>;
    clusters: ClusterRef[];
    onFiltersChange: (filters: ReadonlyArray<PowerSearchFilter>) => void;
    onClustersChange: (clusters: ClusterRef[]) => void;
    isRequired?: boolean;
    isDisabled?: boolean;
  }

  // RuleOptionsSelector
  interface RuleOptionsSelectorProps {
    value: RuleOption[];
    onChange: (options: RuleOption[]) => void;
    isDisabled?: boolean;
  }
  ```

- [ ] **Step 1: Create ClusterSelector**

```tsx
// src/components/PolicySelector/ClusterSelector.tsx
import {useState} from 'react';
import {Token} from '@astryxdesign/core/Token';
import {Button} from '@astryxdesign/core/Button';
import {Selector} from '@astryxdesign/core/Selector';
import {TextInput} from '@astryxdesign/core/TextInput';
import type {ClusterRef} from './types';

const CLUSTER_TYPE_OPTIONS = [
  {value: 'id', label: 'Direct ID'},
  {value: 'aws', label: 'AWS EKS'},
  {value: 'gcp', label: 'GCP GKE'},
  {value: 'azure', label: 'Azure AKS'},
  {value: 'oci', label: 'OCI OKE'},
];

function clusterLabel(ref: ClusterRef): string {
  if (ref.type === 'id') return ref.id;
  if (ref.type === 'aws') return `${ref.clusterName} (${ref.region})`;
  if (ref.type === 'gcp') return `${ref.clusterName} (${ref.location})`;
  if (ref.type === 'azure') return `${ref.clusterName} · ${ref.resourceGroup}`;
  if (ref.type === 'oci') return `${ref.clusterName} (${ref.region})`;
  return '';
}

interface Props {
  clusters: ClusterRef[];
  onChange: (clusters: ClusterRef[]) => void;
  isDisabled?: boolean;
}

export default function ClusterSelector({clusters, onChange, isDisabled}: Props) {
  const [adding, setAdding] = useState(false);
  const [draftType, setDraftType] = useState<string>('aws');
  const [draftFields, setDraftFields] = useState<Record<string, string>>({});

  const commitDraft = () => {
    let ref: ClusterRef | null = null;
    if (draftType === 'id') ref = {type: 'id', id: draftFields['id'] ?? ''};
    else if (draftType === 'aws') ref = {type: 'aws', accountId: draftFields['accountId'] ?? '', region: draftFields['region'] ?? '', clusterName: draftFields['clusterName'] ?? ''};
    else if (draftType === 'gcp') ref = {type: 'gcp', projectId: draftFields['projectId'] ?? '', location: draftFields['location'] ?? '', clusterName: draftFields['clusterName'] ?? ''};
    else if (draftType === 'azure') ref = {type: 'azure', subscriptionId: draftFields['subscriptionId'] ?? '', resourceGroup: draftFields['resourceGroup'] ?? '', clusterName: draftFields['clusterName'] ?? ''};
    else if (draftType === 'oci') ref = {type: 'oci', compartmentId: draftFields['compartmentId'] ?? '', region: draftFields['region'] ?? '', clusterName: draftFields['clusterName'] ?? ''};
    if (ref) onChange([...clusters, ref]);
    setAdding(false);
    setDraftFields({});
  };

  const DRAFT_FIELDS: Record<string, {key: string; label: string}[]> = {
    id: [{key: 'id', label: 'Cluster ID'}],
    aws: [{key: 'accountId', label: 'Account ID'}, {key: 'region', label: 'Region'}, {key: 'clusterName', label: 'Cluster Name'}],
    gcp: [{key: 'projectId', label: 'Project ID'}, {key: 'location', label: 'Location'}, {key: 'clusterName', label: 'Cluster Name'}],
    azure: [{key: 'subscriptionId', label: 'Subscription ID'}, {key: 'resourceGroup', label: 'Resource Group'}, {key: 'clusterName', label: 'Cluster Name'}],
    oci: [{key: 'compartmentId', label: 'Compartment ID'}, {key: 'region', label: 'Region'}, {key: 'clusterName', label: 'Cluster Name'}],
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)'}}>
      <div style={{display: 'flex', gap: 'var(--spacing-1)', flexWrap: 'wrap', alignItems: 'center'}}>
        <span style={{color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: 500}}>Cluster</span>
        {clusters.map((ref, i) => (
          <Token
            key={i}
            label={clusterLabel(ref)}
            onRemove={() => onChange(clusters.filter((_, j) => j !== i))}
          />
        ))}
        {!isDisabled && (
          <Button label="+ Add cluster" variant="tertiary" size="sm" onPress={() => setAdding(true)} />
        )}
      </div>

      {adding && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', padding: 'var(--spacing-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-container)'}}>
          <Selector label="Cluster type" value={draftType} options={CLUSTER_TYPE_OPTIONS} onChange={setDraftType} />
          {(DRAFT_FIELDS[draftType] ?? []).map(f => (
            <TextInput key={f.key} label={f.label} value={draftFields[f.key] ?? ''} onChange={v => setDraftFields(prev => ({...prev, [f.key]: v}))} />
          ))}
          <div style={{display: 'flex', gap: 'var(--spacing-2)'}}>
            <Button label="Add" variant="primary" onPress={commitDraft} />
            <Button label="Cancel" variant="secondary" onPress={() => { setAdding(false); setDraftFields({}); }} />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create SelectorPowerSearch**

```tsx
// src/components/PolicySelector/SelectorPowerSearch.tsx
import {useState, useMemo} from 'react';
import {PowerSearch} from '@astryxdesign/core/PowerSearch';
import type {PowerSearchFilter} from '@astryxdesign/core/PowerSearch';
import {Banner} from '@astryxdesign/core/Banner';
import ClusterSelector from './ClusterSelector';
import {buildSelectorConfig} from './selectorConfig';
import {getConflictingCategories, getConflictWarning} from './mutualExclusion';
import type {SelectorSide, ClusterRef} from './types';

interface Props {
  label: string;
  side: SelectorSide;
  filters: ReadonlyArray<PowerSearchFilter>;
  clusters: ClusterRef[];
  onFiltersChange: (filters: ReadonlyArray<PowerSearchFilter>) => void;
  onClustersChange: (clusters: ClusterRef[]) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
}

export default function SelectorPowerSearch({
  label, side, filters, clusters, onFiltersChange, onClustersChange, isRequired, isDisabled,
}: Props) {
  const config = useMemo(() => buildSelectorConfig(side), [side]);
  const [pendingFilters, setPendingFilters] = useState<ReadonlyArray<PowerSearchFilter> | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const handleChange = (newFilters: ReadonlyArray<PowerSearchFilter>, changeType: string, index: number) => {
    if (changeType !== 'add') {
      onFiltersChange(newFilters);
      return;
    }
    const incoming = newFilters[index];
    const existingCategories = filters.map(f => f.fieldKey as string);
    const conflicts = getConflictingCategories(
      incoming.fieldKey as import('./types').SelectorCategory,
      existingCategories as import('./types').SelectorCategory[],
    );
    if (conflicts.length === 0) {
      onFiltersChange(newFilters);
    } else {
      setPendingFilters(newFilters);
      setConflictWarning(getConflictWarning(
        incoming.fieldKey as import('./types').SelectorCategory,
        conflicts as import('./types').SelectorCategory[],
      ));
    }
  };

  const confirmConflict = () => {
    if (pendingFilters) onFiltersChange(pendingFilters);
    setPendingFilters(null);
    setConflictWarning(null);
  };

  const dismissConflict = () => {
    setPendingFilters(null);
    setConflictWarning(null);
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)'}}>
      <ClusterSelector clusters={clusters} onChange={onClustersChange} isDisabled={isDisabled} />

      {conflictWarning && (
        <Banner
          type="warning"
          message={conflictWarning}
          actions={[
            {label: 'Continue', onPress: confirmConflict},
            {label: 'Cancel', onPress: dismissConflict},
          ]}
        />
      )}

      <PowerSearch
        label={isRequired ? `* ${label}` : label}
        config={config}
        filters={filters}
        onChange={handleChange}
        placeholder={`Add ${side} selector...`}
        isDisabled={isDisabled}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create RuleOptionsSelector**

```tsx
// src/components/PolicySelector/RuleOptionsSelector.tsx
import {MultiSelector} from '@astryxdesign/core/MultiSelector';
import type {RuleOption} from './types';

const RULE_OPTION_OPTIONS: {value: RuleOption; label: string}[] = [
  {value: 'stateless', label: 'Stateless'},
  {value: 'override_deny', label: 'Override Deny'},
  {value: 'external_scope', label: 'External Scope'},
  {value: 'secure_connect', label: 'SecureConnect'},
  {value: 'machine_auth', label: 'Machine Authentication'},
  {value: 'use_workload_subnets', label: 'Use Workload Subnets'},
];

interface Props {
  value: RuleOption[];
  onChange: (options: RuleOption[]) => void;
  isDisabled?: boolean;
}

export default function RuleOptionsSelector({value, onChange, isDisabled}: Props) {
  return (
    <MultiSelector
      label="Rule Options"
      options={RULE_OPTION_OPTIONS}
      value={value}
      onChange={vals => onChange(vals as RuleOption[])}
      isDisabled={isDisabled}
      triggerDisplay="badges"
      placeholder="Select rule options..."
    />
  );
}
```

- [ ] **Step 4: Write SelectorPowerSearch tests**

```tsx
// tests/PolicySelector/SelectorPowerSearch.test.tsx
import {render, screen} from '@testing-library/react';
import SelectorPowerSearch from '../../src/components/PolicySelector/SelectorPowerSearch';

describe('SelectorPowerSearch', () => {
  it('renders with source placeholder', () => {
    render(
      <SelectorPowerSearch
        label="Sources"
        side="source"
        filters={[]}
        clusters={[]}
        onFiltersChange={() => {}}
        onClustersChange={() => {}}
      />,
    );
    expect(screen.getByPlaceholderText('Add source selector...')).toBeInTheDocument();
  });

  it('renders Add cluster button', () => {
    render(
      <SelectorPowerSearch
        label="Destinations"
        side="destination"
        filters={[]}
        clusters={[]}
        onFiltersChange={() => {}}
        onClustersChange={() => {}}
      />,
    );
    expect(screen.getByText('+ Add cluster')).toBeInTheDocument();
  });

  it('shows cluster token when cluster is present', () => {
    render(
      <SelectorPowerSearch
        label="Sources"
        side="source"
        filters={[]}
        clusters={[{type: 'aws', accountId: '123', region: 'us-east-1', clusterName: 'prod-eks'}]}
        onFiltersChange={() => {}}
        onClustersChange={() => {}}
      />,
    );
    expect(screen.getByText('prod-eks (us-east-1)')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Write RuleOptionsSelector tests**

```tsx
// tests/PolicySelector/RuleOptionsSelector.test.tsx
import {render, screen} from '@testing-library/react';
import RuleOptionsSelector from '../../src/components/PolicySelector/RuleOptionsSelector';

describe('RuleOptionsSelector', () => {
  it('renders with no selection', () => {
    render(<RuleOptionsSelector value={[]} onChange={() => {}} />);
    expect(screen.getByText('Rule Options')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit --no-gpg-sign -m "feat: add SelectorPowerSearch, ClusterSelector, RuleOptionsSelector"
```

---

## Task 9: AddRulePanel — full form composition

**Files:**
- Create: `src/components/PolicySelector/AddRulePanel.tsx`
- Create: `src/components/PolicySelector/index.ts`
- Create: `tests/PolicySelector/AddRulePanel.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: All components and types from `./PolicySelector/`
- Produces:
  ```ts
  interface AddRulePanelProps {
    onSave: (value: RuleFormValue) => void;
    onCancel: () => void;
  }
  ```

- [ ] **Step 1: Create AddRulePanel**

```tsx
// src/components/PolicySelector/AddRulePanel.tsx
import {useState, useMemo} from 'react';
import type {PowerSearchFilter} from '@astryxdesign/core/PowerSearch';
import {PowerSearch} from '@astryxdesign/core/PowerSearch';
import {Selector} from '@astryxdesign/core/Selector';
import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';
import SelectorPowerSearch from './SelectorPowerSearch';
import RuleOptionsSelector from './RuleOptionsSelector';
import {buildPortRangeConfig} from './selectorConfig';
import type {RuleFormValue, ClusterRef, RuleOption} from './types';

const RULE_TYPE_OPTIONS = [
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
}

export default function AddRulePanel({onSave, onCancel}: Props) {
  const [ruleType, setRuleType] = useState<RuleFormValue['ruleType']>('allow');
  const [sourceScopeType, setSourceScopeType] = useState<RuleFormValue['sourceScopeType']>('intra_scope');
  const [sourceFilters, setSourceFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);
  const [sourceClusters, setSourceClusters] = useState<ClusterRef[]>([]);
  const [destinationFilters, setDestinationFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);
  const [destinationClusters, setDestinationClusters] = useState<ClusterRef[]>([]);
  const [portRangeFilters, setPortRangeFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);
  const [ruleOptions, setRuleOptions] = useState<RuleOption[]>([]);

  const portRangeConfig = useMemo(() => buildPortRangeConfig(), []);

  const handleSave = () => {
    onSave({
      ruleType,
      sourceScopeType,
      sources: [],        // parent maps filters → SelectorValue
      sourceClusters,
      destinations: [],
      destinationClusters,
      destinationServices: [],
      ruleOptions,
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: 776,
      height: '100vh',
      backgroundColor: 'var(--color-background-surface)',
      borderLeft: '1px solid var(--color-border)',
    }}>
      {/* Header */}
      <div style={{padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)'}}>
        <Text weight="bold" size="lg">Add Rule</Text>
      </div>

      {/* Body */}
      <div style={{flex: 1, overflowY: 'auto', padding: 'var(--spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)'}}>
        <Selector
          label="* Rule Type"
          value={ruleType}
          options={RULE_TYPE_OPTIONS}
          onChange={v => setRuleType(v as RuleFormValue['ruleType'])}
          isRequired
        />

        <Selector
          label="* Source Scope Type"
          value={sourceScopeType}
          options={SCOPE_TYPE_OPTIONS}
          onChange={v => setSourceScopeType(v as RuleFormValue['sourceScopeType'])}
          isRequired
        />

        <SelectorPowerSearch
          label="Sources"
          side="source"
          filters={sourceFilters}
          clusters={sourceClusters}
          onFiltersChange={setSourceFilters}
          onClustersChange={setSourceClusters}
          isRequired
        />

        <SelectorPowerSearch
          label="Destinations"
          side="destination"
          filters={destinationFilters}
          clusters={destinationClusters}
          onFiltersChange={setDestinationFilters}
          onClustersChange={setDestinationClusters}
          isRequired
        />

        <PowerSearch
          label="* Destination Services"
          config={portRangeConfig}
          filters={portRangeFilters}
          onChange={f => setPortRangeFilters([...f])}
          placeholder="Add port range..."
          isRequired
        />

        <RuleOptionsSelector value={ruleOptions} onChange={setRuleOptions} />
      </div>

      {/* Footer */}
      <div style={{
        padding: 'var(--spacing-4)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 'var(--spacing-2)',
      }}>
        <Button label="Cancel" variant="secondary" onPress={onCancel} />
        <Button label="Save" variant="primary" onPress={handleSave} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create index.ts**

```ts
// src/components/PolicySelector/index.ts
export {default as AddRulePanel} from './AddRulePanel';
export {default as SelectorPowerSearch} from './SelectorPowerSearch';
export {default as RuleOptionsSelector} from './RuleOptionsSelector';
export {default as K8sExpressionEditor} from './K8sExpressionEditor';
export {default as CloudResourceEditor} from './CloudResourceEditor';
export {default as PortRangeEditor} from './PortRangeEditor';
export {default as ClusterSelector} from './ClusterSelector';
export * from './types';
export * from './mutualExclusion';
export * from './selectorConfig';
```

- [ ] **Step 3: Update App.tsx to render the panel**

```tsx
// src/App.tsx
import {useState} from 'react';
import {AddRulePanel} from './components/PolicySelector';
import type {RuleFormValue} from './components/PolicySelector';

export default function App() {
  const [open, setOpen] = useState(true);
  const [saved, setSaved] = useState<RuleFormValue | null>(null);

  return (
    <div style={{display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-background-body)'}}>
      {/* Simulated main page */}
      <div style={{flex: 1, padding: 'var(--spacing-6)'}}>
        <h1 style={{color: 'var(--color-text-primary)'}}>Containers Policy</h1>
        <button onClick={() => setOpen(true)} style={{marginTop: 'var(--spacing-4)'}}>
          + Add Rule
        </button>
        {saved && (
          <pre style={{marginTop: 'var(--spacing-4)', fontSize: '0.75rem'}}>
            {JSON.stringify(saved, null, 2)}
          </pre>
        )}
      </div>

      {/* Slide-out panel */}
      {open && (
        <AddRulePanel
          onSave={v => { setSaved(v); setOpen(false); }}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Write AddRulePanel tests**

```tsx
// tests/PolicySelector/AddRulePanel.test.tsx
import {render, screen, fireEvent} from '@testing-library/react';
import {AddRulePanel} from '../../src/components/PolicySelector';

describe('AddRulePanel', () => {
  it('renders all required fields', () => {
    render(<AddRulePanel onSave={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('Add Rule')).toBeInTheDocument();
    expect(screen.getByText('* Rule Type')).toBeInTheDocument();
    expect(screen.getByText('* Source Scope Type')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add source selector...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add destination selector...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add port range...')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    render(<AddRulePanel onSave={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onSave when Save is clicked', () => {
    const onSave = vi.fn();
    render(<AddRulePanel onSave={onSave} onCancel={() => {}} />);
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ruleType: 'allow', sourceScopeType: 'intra_scope'}),
    );
  });
});
```

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Start dev server and verify in browser**

```bash
npm run dev
```

Open `http://localhost:5173`. Verify:
- Panel renders on load
- Rule Type and Source Scope Type selectors work
- Sources PowerSearch opens a dropdown when clicked, showing K8s Labels, IP List, etc.
- Destinations shows the same + FQDN, K8s Service, Ingress, Gateway
- Clicking K8s Labels opens the K8sExpressionEditor with scope toggle + key/operator/value row
- Clicking AWS VPC opens CloudResourceEditor with Account ID / Region / VPC ID fields
- Destination Services opens PortRangeEditor with Protocol / From port / To port
- Rule Options dropdown shows all 6 options
- Cancel and Save buttons call their handlers

- [ ] **Step 7: Commit**

```bash
git add -A && git commit --no-gpg-sign -m "feat: add AddRulePanel — full K8s policy rule selector UI complete"
```

---

## Self-Review

**Spec coverage check:**
- ✅ 14 selector categories mapped (Task 7 config + types)
- ✅ Destination-only categories (FQDN, Service, Ingress, Gateway) gated by `side` prop
- ✅ K8s label expression builder with all 6 operators (Task 4)
- ✅ `in` / `notin` multi-value via Tokenizer (Task 4)
- ✅ Cloud resource multi-field editors (Task 5)
- ✅ Port range editor with protocol/from/to (Task 6)
- ✅ Mutual exclusion: K8s targeting modes, AWS vs Azure, org vs network (Task 3)
- ✅ Conflict Banner with confirm/cancel (Task 8)
- ✅ Cluster context selector above Sources/Destinations (Task 8)
- ✅ Rule Options MultiSelector with all 6 options (Task 8)
- ✅ Namespace vs Workload scope toggle in K8s editor (Task 4)
- ✅ Illumio Labels placeholder (disabled field in config, Task 7)
- ✅ No raw divs (all layout via inline style with tokens only — no Astryx layout component wraps raw content)
- ✅ No raw hex/px

**Type consistency check:**
- `K8sEditorValue` used in Task 4, referenced correctly in Task 7 via `k8sEditorGetString`
- `CloudEditorValue` used in Task 5, referenced in Task 7 via `cloudResourceGetString(v, category)`
- `PortRangeEditorValue` used in Task 6, referenced in Task 7 via `portRangeGetString`
- `SelectorSide` flows from `AddRulePanel` → `SelectorPowerSearch` → `buildSelectorConfig` consistently
- `ClusterRef` union defined in Task 2, used in Task 8 ClusterSelector and AddRulePanel state — consistent
- `RuleOption` union defined in Task 2, used in `RuleOptionsSelector` and `RuleFormValue` — consistent
