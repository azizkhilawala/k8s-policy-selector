import type { SelectorCategory } from './types';

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
