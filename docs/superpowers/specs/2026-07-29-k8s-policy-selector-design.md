# K8s Policy Rule Selector — Design Spec

## Overview

A guided, inline-expanding selector UI for Kubernetes policy rule authoring inside Illumio's "Add Rule" slide-out panel. Replaces the Sources, Destinations, Destination Services, and Rule Options fields with structured expression builders powered by Astryx's `PowerSearch` and `MultiSelector` components.

---

## Architecture

**Approach A — PowerSearch native.** All four fields use Astryx components:
- Sources → `SelectorPowerSearch` (PowerSearch + ClusterSelector)
- Destinations → `SelectorPowerSearch` (PowerSearch + ClusterSelector)
- Destination Services → `PowerSearch` with custom `PortRangeEditor`
- Rule Options → `MultiSelector`

Three custom `CustomOperatorValue.Editor` components handle complex inputs:
- `K8sExpressionEditor` — guided key + operator + values rows
- `CloudResourceEditor` — multi-field cloud resource form (AWS VPC/Subnet, Azure VNet/Subnet)
- `PortRangeEditor` — protocol + from_port + to_port

---

## Component Architecture

```
AddRulePanel
├── Selector             (Rule Type: Allow / Deny / Override Deny)
├── Selector             (Source Scope Type: Intra-Scope / Extra-Scope)
├── SelectorPowerSearch  side="source"
│   ├── ClusterSelector
│   └── PowerSearch      (14 categories, source-gated)
├── SelectorPowerSearch  side="destination"
│   ├── ClusterSelector
│   └── PowerSearch      (14 categories + FQDN/Service/Ingress/Gateway)
├── PowerSearch          (Destination Services — port ranges)
└── MultiSelector        (Rule Options)
```

---

## Selector Categories (14 total)

| # | Category | Side | PowerSearch value type |
|---|---|---|---|
| 1 | K8s Labels | Both | `custom` → K8sExpressionEditor |
| 2 | Service Account | Both | `string_list` |
| 3 | FQDN | Dest only | `string_list` |
| 4 | K8s Service | Dest only | `string_list` |
| 5 | K8s Ingress | Dest only | `string_list` |
| 6 | K8s Gateway | Dest only | `string_list` |
| 7 | IP List | Both | `string_list` |
| 8 | AWS Account | Both | `string_list` |
| 9 | AWS VPC | Both | `custom` → CloudResourceEditor |
| 10 | AWS Subnet | Both | `custom` → CloudResourceEditor |
| 11 | Azure Subscription | Both | `string_list` |
| 12 | Azure VNet | Both | `custom` → CloudResourceEditor |
| 13 | Azure Subnet | Both | `string_list` (full Azure resource ID) |
| 14 | Illumio Labels | Both | disabled placeholder |

---

## Mutual Exclusion Rules

- K8s Labels / Service Account (workload mode) ↔ K8s Service / Ingress / Gateway (service mode): mutually exclusive on destination
- AWS categories (8–10) ↔ Azure categories (11–13): mutually exclusive in same selector side
- AWS Account (org) ↔ AWS VPC / Subnet (network): mutually exclusive
- Azure Subscription (org) ↔ Azure VNet / Subnet (network): mutually exclusive

Conflicts surface a `Banner` (warning) with Continue / Cancel actions before applying.

---

## K8s Expression Operators

| Operator key | Display | Expression | Values input |
|---|---|---|---|
| `eq` | = equals | `key=value` | Single TextInput |
| `exists` | =* exists | `key=*` | Hidden |
| `neq` | != not equals | `key!=value` | Single TextInput |
| `in` | in set | `key in [a,b]` | Tokenizer (multi) |
| `notin` | notin set | `key notin [a,b]` | Tokenizer (multi) |
| `notexists` | ! does not exist | `!key` | Hidden |

Scope toggle (Namespace / Workload) maps to `namespace_selector` vs `workload_selector` in Terraform output.

---

## Destination Services

Each PowerSearch token = one port range entry. Custom editor:
- Protocol: `Selector` (TCP / UDP)
- From port: `NumberInput` (0–65535)
- To port: `NumberInput` (0–65535)

Token display: `TCP 443` or `TCP 8080–9000`.

---

## Rule Options (MultiSelector)

| Value | Label |
|---|---|
| `stateless` | Stateless |
| `override_deny` | Override Deny |
| `external_scope` | External Scope |
| `secure_connect` | SecureConnect |
| `machine_auth` | Machine Authentication |
| `use_workload_subnets` | Use Workload Subnets |

---

## Cluster Context Selector

Sits above Sources and Destinations PowerSearch bars. Cluster chips + "Add cluster" button. Supports 5 cluster types: Direct ID, AWS EKS, GCP GKE, Azure AKS, OCI OKE.

---

## Output Type

```ts
interface RuleFormValue {
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
