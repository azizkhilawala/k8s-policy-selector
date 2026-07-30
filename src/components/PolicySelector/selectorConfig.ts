import type {PowerSearchConfig} from '@astryxdesign/core/PowerSearch';
import {createStaticSource} from '@astryxdesign/core/Typeahead';
import CloudResourceEditor, {cloudResourceGetString} from './CloudResourceEditor';
import K8sNamespaceEditor, {namespaceGetString} from './K8sNamespaceEditor';
import PortRangeEditor, {portRangeGetString} from './PortRangeEditor';
import type {SelectorSide} from './types';

function makeCloudEditor(category: Parameters<typeof cloudResourceGetString>[1]) {
  return {
    type: 'custom' as const,
    Editor: (props: {isDisabled?: boolean; onChange: (v: string | null) => void; placeholder: string; value: string | null}) =>
      CloudResourceEditor({...props, category}),
    getString: (v: string) => cloudResourceGetString(v, category),
  };
}

function makeStringList(values: string[]) {
  const items = values.map(v => ({id: v, label: v}));
  return {
    type: 'string_list' as const,
    isArbitraryStringAllowed: true,
    searchSource: createStaticSource(items),
  };
}

// ── K8s Labels: key=value pairs ───────────────────────────────────────────────
// Same key → OR, different key → AND
const K8S_LABEL_SUGGESTIONS = [
  'app=frontend', 'app=backend', 'app=api', 'app=worker', 'app=scheduler',
  'env=production', 'env=staging', 'env=development', 'env=qa',
  'tier=web', 'tier=api', 'tier=database', 'tier=cache', 'tier=queue',
  'version=v1', 'version=v2', 'version=stable', 'version=canary',
  'component=controller', 'component=proxy', 'component=agent',
  'release=stable', 'release=beta',
  'region=us-east-1', 'region=us-west-2', 'region=eu-west-1',
];

// ── K8s Cluster ───────────────────────────────────────────────────────────────
const K8S_CLUSTER_SUGGESTIONS = [
  'prod-us-east-1', 'prod-us-west-2', 'prod-eu-west-1',
  'staging-us-east-1', 'staging-eu-west-1',
  'dev-cluster', 'qa-cluster', 'dr-cluster',
];

// ── Service Account ───────────────────────────────────────────────────────────
const K8S_SERVICE_ACCOUNT_SUGGESTIONS = [
  'default', 'kube-dns', 'coredns', 'metrics-server',
  'prometheus', 'grafana', 'fluentd', 'filebeat',
  'cert-manager', 'nginx-ingress', 'argocd-server',
  'vault', 'external-secrets', 'cluster-autoscaler',
];

// ── IP List ───────────────────────────────────────────────────────────────────
const IP_LIST_SUGGESTIONS = [
  '10.0.0.0/8', '10.0.0.0/16', '10.0.1.0/24',
  '192.168.0.0/16', '192.168.1.0/24',
  '172.16.0.0/12', '172.16.0.0/16',
  '100.64.0.0/10', '0.0.0.0/0',
];

// ── AWS Account ───────────────────────────────────────────────────────────────
const AWS_ACCOUNT_SUGGESTIONS = [
  '123456789012', '234567890123', '345678901234',
  'prod-account', 'staging-account', 'dev-account',
];

// ── Azure Subscription ────────────────────────────────────────────────────────
const AZURE_SUBSCRIPTION_SUGGESTIONS = [
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  'prod-subscription', 'staging-subscription', 'dev-subscription',
];

// ── Destination-only ──────────────────────────────────────────────────────────
const FQDN_SUGGESTIONS = [
  '*.amazonaws.com', '*.s3.amazonaws.com', '*.execute-api.amazonaws.com',
  '*.azure.com', '*.blob.core.windows.net', '*.azurewebsites.net',
  '*.googleapis.com', '*.storage.googleapis.com',
  'api.example.com', 'auth.example.com', 'cdn.example.com',
  '*.internal', 'elasticsearch.logging.svc.cluster.local',
];

const K8S_SERVICE_SUGGESTIONS = [
  'kubernetes', 'kube-dns', 'metrics-server',
  'nginx-ingress-controller', 'istio-ingressgateway',
  'frontend-svc', 'backend-api-svc', 'auth-svc',
  'postgres-svc', 'redis-svc', 'elasticsearch-svc',
];

const K8S_INGRESS_SUGGESTIONS = [
  'app-ingress', 'api-ingress', 'auth-ingress',
  'frontend-ingress', 'admin-ingress',
];

const K8S_GATEWAY_SUGGESTIONS = [
  'istio-ingressgateway', 'istio-egressgateway',
  'kong-gateway', 'nginx-gateway', 'envoy-gateway',
];

// ── Illumio Labels: Dimension:Value pairs ─────────────────────────────────────
// Same dimension → OR, different dimension → AND
const ILLUMIO_LABEL_SUGGESTIONS = [
  'Role:web', 'Role:api', 'Role:database', 'Role:cache', 'Role:worker', 'Role:queue', 'Role:proxy', 'Role:monitoring',
  'App:frontend', 'App:backend', 'App:auth-service', 'App:payment', 'App:inventory', 'App:notification', 'App:analytics', 'App:search',
  'Env:Production', 'Env:Staging', 'Env:Development', 'Env:QA', 'Env:DR', 'Env:Sandbox',
  'Loc:us-east-1', 'Loc:us-west-2', 'Loc:eu-west-1', 'Loc:ap-southeast-1', 'Loc:datacenter-nyc', 'Loc:datacenter-london',
];

export function buildSelectorConfig(side: SelectorSide): PowerSearchConfig {
  const isDestination = side === 'destination';

  const fields: Array<PowerSearchConfig['fields'][number]> = [
    {
      key: 'k8s_labels',
      label: 'K8s Labels',
      defaultOperator: 'is_any',
      operators: [{
        key: 'is_any',
        label: 'includes',
        value: makeStringList(K8S_LABEL_SUGGESTIONS),
      }],
    },
    {
      key: 'k8s_namespace',
      label: 'K8s Namespace',
      defaultOperator: 'select',
      operators: [{
        key: 'select',
        label: 'matches',
        value: {
          type: 'custom' as const,
          Editor: (props: {isDisabled?: boolean; onChange: (v: string | null) => void; placeholder: string; value: string | null}) =>
            K8sNamespaceEditor(props),
          getString: (v: string) => namespaceGetString(v),
        },
      }],
    },
    {
      key: 'k8s_cluster',
      label: 'K8s Cluster',
      defaultOperator: 'is_any',
      operators: [
        {
          key: 'is_any',
          label: 'is any of',
          value: makeStringList(K8S_CLUSTER_SUGGESTIONS),
        },
        {
          key: 'is_not',
          label: 'is not',
          value: makeStringList(K8S_CLUSTER_SUGGESTIONS),
        },
      ],
    },
    {
      key: 'k8s_service_account',
      label: 'Service Account',
      defaultOperator: 'is_any',
      operators: [
        {
          key: 'is_any',
          label: 'is any of',
          value: makeStringList(K8S_SERVICE_ACCOUNT_SUGGESTIONS),
        },
        {
          key: 'is_not',
          label: 'is not',
          value: makeStringList(K8S_SERVICE_ACCOUNT_SUGGESTIONS),
        },
      ],
    },
    {
      key: 'ip_list',
      label: 'IP List',
      defaultOperator: 'is_any',
      operators: [
        {
          key: 'is_any',
          label: 'is any of',
          value: makeStringList(IP_LIST_SUGGESTIONS),
        },
        {
          key: 'is_not',
          label: 'excludes',
          value: makeStringList(IP_LIST_SUGGESTIONS),
        },
      ],
    },
    {
      key: 'cloud_aws_account',
      label: 'AWS Account',
      defaultOperator: 'is_any',
      operators: [
        {
          key: 'is_any',
          label: 'is any of',
          value: makeStringList(AWS_ACCOUNT_SUGGESTIONS),
        },
        {
          key: 'is_not',
          label: 'is not',
          value: makeStringList(AWS_ACCOUNT_SUGGESTIONS),
        },
      ],
    },
    {
      key: 'cloud_aws_vpc',
      label: 'AWS VPC',
      defaultOperator: 'is',
      operators: [{key: 'is', label: 'is', value: makeCloudEditor('cloud_aws_vpc')}],
    },
    {
      key: 'cloud_aws_subnet',
      label: 'AWS Subnet',
      defaultOperator: 'is',
      operators: [{key: 'is', label: 'is', value: makeCloudEditor('cloud_aws_subnet')}],
    },
    {
      key: 'cloud_azure_subscription',
      label: 'Azure Subscription',
      defaultOperator: 'is_any',
      operators: [
        {
          key: 'is_any',
          label: 'is any of',
          value: makeStringList(AZURE_SUBSCRIPTION_SUGGESTIONS),
        },
        {
          key: 'is_not',
          label: 'is not',
          value: makeStringList(AZURE_SUBSCRIPTION_SUGGESTIONS),
        },
      ],
    },
    {
      key: 'cloud_azure_vnet',
      label: 'Azure VNet',
      defaultOperator: 'is',
      operators: [{key: 'is', label: 'is', value: makeCloudEditor('cloud_azure_vnet')}],
    },
    {
      key: 'cloud_azure_subnet',
      label: 'Azure Subnet',
      defaultOperator: 'is',
      operators: [{key: 'is', label: 'is', value: makeCloudEditor('cloud_azure_subnet')}],
    },
    {
      key: 'illumio_labels',
      label: 'Illumio Labels',
      defaultOperator: 'is_any',
      operators: [{
        key: 'is_any',
        label: 'includes',
        value: makeStringList(ILLUMIO_LABEL_SUGGESTIONS),
      }],
    },
  ];

  if (isDestination) {
    fields.push(
      {
        key: 'fqdn',
        label: 'FQDN',
        defaultOperator: 'is_any',
        operators: [
          {
            key: 'is_any',
            label: 'matches any of',
            value: makeStringList(FQDN_SUGGESTIONS),
          },
          {
            key: 'is_not',
            label: 'does not match',
            value: makeStringList(FQDN_SUGGESTIONS),
          },
        ],
      },
      {
        key: 'k8s_service',
        label: 'K8s Service',
        defaultOperator: 'is_any',
        operators: [
          {
            key: 'is_any',
            label: 'is any of',
            value: makeStringList(K8S_SERVICE_SUGGESTIONS),
          },
          {
            key: 'is_not',
            label: 'is not',
            value: makeStringList(K8S_SERVICE_SUGGESTIONS),
          },
        ],
      },
      {
        key: 'k8s_ingress',
        label: 'K8s Ingress',
        defaultOperator: 'is_any',
        operators: [
          {
            key: 'is_any',
            label: 'is any of',
            value: makeStringList(K8S_INGRESS_SUGGESTIONS),
          },
          {
            key: 'is_not',
            label: 'is not',
            value: makeStringList(K8S_INGRESS_SUGGESTIONS),
          },
        ],
      },
      {
        key: 'k8s_gateway',
        label: 'K8s Gateway',
        defaultOperator: 'is_any',
        operators: [
          {
            key: 'is_any',
            label: 'is any of',
            value: makeStringList(K8S_GATEWAY_SUGGESTIONS),
          },
          {
            key: 'is_not',
            label: 'is not',
            value: makeStringList(K8S_GATEWAY_SUGGESTIONS),
          },
        ],
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
        value: {type: 'custom' as const, Editor: PortRangeEditor, getString: portRangeGetString},
      }],
    }],
  };
}
