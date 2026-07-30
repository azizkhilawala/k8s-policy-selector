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
  sourceProcessServices: PortRange[];
  destinations: SelectorValue[];
  destinationClusters: ClusterRef[];
  destinationServices: PortRange[];
  ruleOptions: RuleOption[];
}
