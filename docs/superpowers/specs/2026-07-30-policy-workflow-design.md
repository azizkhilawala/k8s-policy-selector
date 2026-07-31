# Policy Workflow Design

## Goal

Build an end-to-end policy management UI covering Illumio CloudSecure, PCE, and Containers environments. Users can create policies, add and edit rules using the existing `AddRulePanel` selector component, and provision changes to workloads. The workflow serves two personas: security admins (org-wide guardrail policies) and app owners (scoped application policies).

## Architecture

Two new pages added to the existing app, both using `@astryxdesign/core` components exclusively and following the Astryx-only design system rule in `CLAUDE.md`.

```
src/
  pages/
    PolicyListPage.tsx        — list of all policies, two tabs
    PolicyEditorPage.tsx      — rule table + provision bar for one policy
  components/
    Policy/
      PolicyHeader.tsx        — name, type, scope, enforcement mode form bar
      RulesTable.tsx          — sortable rule rows with type/status badges
      RulesToolbar.tsx        — Add Rule button, type filter, search
      ProvisionBar.tsx        — sticky draft-change counter + provision CTA
      ImpactPanel.tsx         — slide-over showing affected workloads
      ProvisionDialog.tsx     — confirmation dialog with spinner states
      RuleRow.tsx             — single rule row with token pills and actions
      types.ts                — Policy, Rule, RuleStatus, Persona types
```

The existing `AddRulePanel` and `SelectorPowerSearch` are reused unchanged except for a new `environment` prop and edit-mode pre-population.

## Tech Stack

- React 18 + TypeScript (strict)
- `@astryxdesign/core` v0.1.9 — all components, tokens, typography
- Vite + Vitest (existing build/test pipeline)
- In-memory mock state (no real API — demo prototype)

## Global Constraints

- All UI: `@astryxdesign/core` components only — no raw `<button>`, `<input>`, `<select>`, hex colors, raw px values, or custom typography
- Spacing: `var(--spacing-*)` tokens only
- Colors: `var(--color-*)` tokens only
- Typography: `<Text>` component only — no inline `fontSize`/`fontWeight`
- Git commits: `--no-gpg-sign` flag required
- Branch: `worktree-k8s-policy-selector` — never push to main

---

## Section 1 — Page Structure & Navigation

Two top-level pages under the `/policy` route:

- `PolicyListPage` — `/policy` — entry point for both personas
- `PolicyEditorPage` — `/policy/new` or `/policy/:id` — editor for a single policy

Navigation between them is handled with React state (no router dependency — the app uses a simple page-switcher pattern consistent with the existing `App.tsx`).

The existing `App.tsx` gains a top-level nav: a `Tab` or `Button` group switching between "Containers Policy" (existing demo) and "Policies" (new workflow).

---

## Section 2 — Policy List Page

### Header
- Page title: `<Text size="xl" weight="bold">Policies</Text>`
- `+ Create Policy` primary `Button` top-right, navigates to `PolicyEditorPage` in create mode
- Two `Tab` components: **Organization Policies** | **Application Policies**

### Organization Policies tab (admin-only write access)
- No Scope column
- Extra column: Enforcement Mode (Visibility / Selective / Full)
- App owners see this tab as read-only — no Create/Edit/Delete actions visible

### Application Policies tab (admin + app owner)
- Scope column: up to 4 Illumio label `Token` pills (Role · App · Env · Loc), truncated with `+N`
- App owners see only policies scoped to their own labels

### Table columns (both tabs)

| Column | Component | Notes |
|---|---|---|
| Name | `Text` (clickable) | Navigates to PolicyEditorPage |
| Scope | `Token` pills | Hidden in Org tab |
| Rules | `Text` | Integer count |
| Status | `Badge` | Draft (warning) / Active (success) / Mixed (info) |
| Last Modified | `Text` | Relative timestamp |
| Actions | Icon `Button` | Edit / Duplicate / Delete in a `Popover` |

### Status values
- **Active** — all rules provisioned, no pending changes
- **Draft** — never provisioned
- **Mixed** — some rules active, some pending

### Empty state
Centered empty state with descriptive `Text` and a `+ Create Policy` `Button`.

---

## Section 3 — Policy Editor Page

### 3a — Policy Header

Compact form bar pinned to the top of the editor page.

| Field | Component | Constraint |
|---|---|---|
| Policy Name | `TextInput` | Required |
| Policy Type | `Selector` | Organization / Application — locked after first save |
| Scope | `SelectorPowerSearch` (label-only config) | Visible only when type = Application; Role · App · Env · Loc dimensions |
| Enforcement Mode | `Selector` | Visibility / Selective / Full — visible only when type = Organization |
| Save | `Button` primary | Saves policy metadata as draft |

The scope picker reuses `SelectorPowerSearch` with a dedicated `buildLabelScopeConfig()` that exposes only the four Illumio label dimensions, none of the K8s/cloud categories.

### 3b — Rules Table

Rules are ordered by precedence: Override Deny rows first, then Deny, then Allow. Within each type, the user can reorder via drag handle.

#### Toolbar
- `+ Add Rule` — small primary `Button`, opens `AddRulePanel` slide-out in create mode
- Rule type filter — `MultiSelector` with options: All / Allow / Deny / Override Deny
- Search — `TextInput` filtering by source/destination/service text content

#### Table columns

| Column | Detail |
|---|---|
| # | Row number + drag handle |
| Type | `Badge` — Override Deny (`critical`) / Deny (`warning`) / Allow (`success`) |
| Scope Type | `Text` — Intra-scope / Extra-scope |
| Sources | `Token` pills, max 3 + `+N` overflow |
| Destinations | `Token` pills, max 3 + `+N` overflow |
| Services | Port/protocol `Token` pills |
| Options | Icon indicators — lock (SecureConnect), shield (MachineAuth), bolt (Stateless) |
| Status | `Badge` — Active / Draft / Modified |
| Actions | Edit `Button` (opens slide-out in edit mode) / Delete / Enable·Disable toggle |

Clicking any row opens `AddRulePanel` in edit mode pre-populated with that rule's values.

### 3c — Provision Bar

Sticky bar fixed to the bottom of `PolicyEditorPage`. Visible only when draft changes exist.

```
● 3 unpublished changes        [Show Impact]    [Provision ▸]
```

- Left: `Badge` (warning) with unpublished count + `Text` label
- Center: `Button` secondary — "Show Impact" → opens `ImpactPanel` slide-over
- Right: `Button` primary — "Provision ▸" → opens `ProvisionDialog`

Disappears after successful provisioning.

---

## Section 4 — Add Rule Panel Integration & Provisioning

### 4a — AddRulePanel extensions

Two additions to the existing component interface:

**Edit mode:** Panel receives an optional `initialValue: RuleFormValue` prop. When provided, all fields are pre-populated. Header reads "Edit Rule", save button reads "Update Rule". On save the rule is updated in place rather than appended.

**Environment prop:** `environment: 'cloudsecure' | 'pce' | 'containers'` controls which PowerSearch categories are available:

| Environment | Source/Destination categories |
|---|---|
| `cloudsecure` | K8s Labels, K8s Namespace, K8s Cluster, Service Account, Illumio Labels, IP List, AWS Account/VPC/Subnet, Azure Subscription/VNet/Subnet, FQDN, K8s Service, K8s Ingress, K8s Gateway |
| `pce` | Illumio Labels (Role/App/Env/Loc), IP List, FQDN |
| `containers` | Full union of all categories above |

**Persona gating in AddRulePanel:**

| Field | Security Admin | App Owner |
|---|---|---|
| Rule Type — Allow | ✅ | ✅ |
| Rule Type — Deny / Override Deny | ✅ | ❌ (hidden) |
| Source Scope Type — Extra-scope | ✅ | ✅ (within own env labels) |

A `persona: 'admin' | 'app_owner'` prop controls hidden fields.

### 4b — ImpactPanel

A slide-over (`Panel` or right-side drawer) showing:
- Title: "Impact Analysis"
- Subtitle: "These workloads will be affected by provisioning"
- Table: Workload Name | Environment | Current Enforcement | New Enforcement
- Footer: `[Cancel]` `[Confirm & Provision]` buttons

Mock data only for this prototype.

### 4c — ProvisionDialog

A `Dialog` component with three internal states:

**Idle:**
```
"Provision [Policy Name]?"
"This will push 3 rule changes to active enforcement."
[Cancel]  [Show Impact first]  [Provision Now]
```

**In progress:**
```
[Spinner] "Provisioning changes…"
```

**Success → Dialog closes:**
- Provision bar disappears
- All Draft/Modified `Badge` statuses → Active
- Success `Banner` at top: "Policy provisioned. Rules are active on X workloads."

**Failure → Dialog closes:**
- Error `Banner`: "Provisioning failed: [reason]. Draft changes preserved."
- Badges remain Draft/Modified

### 4d — Persona gating summary

| Action | Security Admin | App Owner |
|---|---|---|
| Create Org Policy | ✅ | ❌ (read-only) |
| Create App Policy | ✅ | ✅ |
| Add Allow rule | ✅ | ✅ |
| Add Deny / Override Deny rule | ✅ | ❌ |
| Extra-scope source | ✅ | ✅ (own env) |
| Provision | ✅ | ✅ (own policies) |
| Show Impact | ✅ | ✅ |
| View Org Policies tab | ✅ | ✅ (read-only) |

---

## Data Model

```typescript
type PolicyType = 'organization' | 'application';
type EnforcementMode = 'visibility' | 'selective' | 'full';
type PolicyStatus = 'draft' | 'active' | 'mixed';
type RuleStatus = 'draft' | 'active' | 'modified';
type RuleType = 'allow' | 'deny' | 'override_deny';
type Persona = 'admin' | 'app_owner';
type Environment = 'cloudsecure' | 'pce' | 'containers';

interface Policy {
  id: string;
  name: string;
  type: PolicyType;
  scope: SelectorValue[];           // Illumio label dimensions
  enforcementMode?: EnforcementMode; // org policies only
  environment: Environment;
  rules: Rule[];
  status: PolicyStatus;
  lastModified: string;
}

interface Rule {
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

interface RuleOptions {
  stateless: boolean;
  secureConnect: boolean;
  machineAuth: boolean;
  useWorkloadSubnets: boolean;
}
```

---

## Error Handling

- **Empty policy name on save:** inline `TextInput` status error — "Policy name is required"
- **No scope on Application policy:** inline error on the scope picker
- **Rule with no sources or destinations:** `AddRulePanel` Apply button disabled until both are filled
- **Provisioning failure:** `Banner` with reason string, no data loss — draft state preserved
- **Deleting an active rule:** confirmation `Dialog` — "This rule is active. Deleting it will require reprovisioning."

## Testing

- Unit tests in `tests/Policy/` covering: type discriminants, persona gating logic, provision state machine, rule ordering by precedence
- No UI integration tests (Vitest/RTL environment limitation with Astryx components)
