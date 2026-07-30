import type {PowerSearchConfig} from '@astryxdesign/core/PowerSearch';
import K8sExpressionEditor, {k8sEditorGetString} from './K8sExpressionEditor';
import CloudResourceEditor, {cloudResourceGetString} from './CloudResourceEditor';
import PortRangeEditor, {portRangeGetString} from './PortRangeEditor';
import IllumioLabelEditor, {illumioEditorGetString} from './IllumioLabelEditor';
import type {SelectorSide} from './types';

// Wrap CloudResourceEditor to bind the category prop (CustomOperatorValue.Editor
// only receives isDisabled, onChange, placeholder, value).
function makeCloudEditor(category: Parameters<typeof cloudResourceGetString>[1]) {
  return {
    type: 'custom' as const,
    Editor: (props: {isDisabled?: boolean; onChange: (v: string | null) => void; placeholder: string; value: string | null}) =>
      CloudResourceEditor({...props, category}),
    getString: (v: string) => cloudResourceGetString(v, category),
  };
}

// Rich suggestion lists for searchable categories
const K8S_NAMESPACE_SUGGESTIONS = [
  'default', 'kube-system', 'kube-public', 'kube-node-lease',
  'production', 'staging', 'development', 'qa', 'sandbox',
  'monitoring', 'logging', 'ingress-nginx', 'cert-manager',
  'istio-system', 'argocd', 'flux-system',
];

const K8S_CLUSTER_SUGGESTIONS = [
  'prod-us-east-1', 'prod-us-west-2', 'prod-eu-west-1',
  'staging-us-east-1', 'staging-eu-west-1',
  'dev-cluster', 'qa-cluster', 'dr-cluster',
];

const K8S_SERVICE_ACCOUNT_SUGGESTIONS = [
  'default', 'kube-dns', 'coredns', 'metrics-server',
  'prometheus', 'grafana', 'fluentd', 'filebeat',
  'cert-manager', 'nginx-ingress', 'argocd-server',
  'vault', 'external-secrets', 'cluster-autoscaler',
];

const FQDN_SUGGESTIONS = [
  '*.amazonaws.com', '*.s3.amazonaws.com', '*.execute-api.amazonaws.com',
  '*.azure.com', '*.blob.core.windows.net', '*.azurewebsites.net',
  '*.googleapis.com', '*.storage.googleapis.com',
  'api.example.com', 'auth.example.com', 'cdn.example.com',
  '*.internal', 'elasticsearch.logging.svc.cluster.local',
];

const IP_LIST_SUGGESTIONS = [
  '10.0.0.0/8', '10.0.0.0/16', '10.0.1.0/24',
  '192.168.0.0/16', '192.168.1.0/24',
  '172.16.0.0/12', '172.16.0.0/16',
  '100.64.0.0/10',
  '0.0.0.0/0',
];

const AWS_ACCOUNT_SUGGESTIONS = [
  '123456789012', '234567890123', '345678901234',
  'prod-account', 'staging-account', 'dev-account',
];

const AZURE_SUBSCRIPTION_SUGGESTIONS = [
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  'prod-subscription', 'staging-subscription', 'dev-subscription',
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

function makeSuggestionStringList(suggestions: string[]) {
  return {
    type: 'string_list' as const,
    isArbitraryStringAllowed: true,
    suggestions: suggestions.map(s => ({id: s, label: s})),
  };
}

export function buildSelectorConfig(side: SelectorSide): PowerSearchConfig {
  const isDestination = side === 'destination';

  const fields: Array<PowerSearchConfig['fields'][number]> = [
    // ── K8s Labels — full expression builder ─────────────────────────────────
    {
      key: 'k8s_labels',
      label: 'K8s Labels',
      defaultOperator: 'expr',
      operators: [{
        key: 'expr',
        label: 'matches',
        value: {type: 'custom' as const, Editor: K8sExpressionEditor, getString: k8sEditorGetString},
      }],
    },

    // ── K8s Namespace — searchable with rich examples ─────────────────────────
    {
      key: 'k8s_namespace',
      label: 'K8s Namespace',
      defaultOperator: 'is_any',
      operators: [
        {
          key: 'is_any',
          label: 'is any of',
          value: makeSuggestionStringList(K8S_NAMESPACE_SUGGESTIONS),
        },
        {
          key: 'is_not',
          label: 'is not',
          value: makeSuggestionStringList(K8S_NAMESPACE_SUGGESTIONS),
        },
        {
          key: 'starts_with',
          label: 'starts with',
          value: {type: 'string' as const},
        },
      ],
    },

    // ── K8s Cluster — searchable cluster name picker ──────────────────────────
    {
      key: 'k8s_cluster',
      label: 'K8s Cluster',
      defaultOperator: 'is_any',
      operators: [
        {
          key: 'is_any',
          label: 'is any of',
          value: makeSuggestionStringList(K8S_CLUSTER_SUGGESTIONS),
        },
        {
          key: 'is_not',
          label: 'is not',
          value: makeSuggestionStringList(K8S_CLUSTER_SUGGESTIONS),
        },
      ],
    },

    // ── Service Account — searchable ──────────────────────────────────────────
    {
      key: 'k8s_service_account',
      label: 'Service Account',
      defaultOperator: 'is_any',
      operators: [
        {
          key: 'is_any',
          label: 'is any of',
          value: makeSuggestionStringList(K8S_SERVICE_ACCOUNT_SUGGESTIONS),
        },
        {
          key: 'is_not',
          label: 'is not',
          value: makeSuggestionStringList(K8S_SERVICE_ACCOUNT_SUGGESTIONS),
        },
      ],
    },

    // ── IP List — searchable CIDR ranges ─────────────────────────────────────
    {
      key: 'ip_list',
      label: 'IP List',
      defaultOperator: 'is_any',
      operators: [
        {
          key: 'is_any',
          label: 'is any of',
          value: makeSuggestionStringList(IP_LIST_SUGGESTIONS),
        },
        {
          key: 'is_not',
          label: 'excludes',
          value: makeSuggestionStringList(IP_LIST_SUGGESTIONS),
        },
      ],
    },

    // ── AWS Account ───────────────────────────────────────────────────────────
    {
      key: 'cloud_aws_account',
      label: 'AWS Account',
      defaultOperator: 'is_any',
      operators: [
        {
          key: 'is_any',
          label: 'is any of',
          value: makeSuggestionStringList(AWS_ACCOUNT_SUGGESTIONS),
        },
        {
          key: 'is_not',
          label: 'is not',
          value: makeSuggestionStringList(AWS_ACCOUNT_SUGGESTIONS),
        },
      ],
    },

    // ── AWS VPC ───────────────────────────────────────────────────────────────
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

    // ── AWS Subnet ────────────────────────────────────────────────────────────
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

    // ── Azure Subscription ────────────────────────────────────────────────────
    {
      key: 'cloud_azure_subscription',
      label: 'Azure Subscription',
      defaultOperator: 'is_any',
      operators: [
        {
          key: 'is_any',
          label: 'is any of',
          value: makeSuggestionStringList(AZURE_SUBSCRIPTION_SUGGESTIONS),
        },
        {
          key: 'is_not',
          label: 'is not',
          value: makeSuggestionStringList(AZURE_SUBSCRIPTION_SUGGESTIONS),
        },
      ],
    },

    // ── Azure VNet ────────────────────────────────────────────────────────────
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

    // ── Azure Subnet ──────────────────────────────────────────────────────────
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

    // ── Illumio Labels — 4-dimension model with real example values ───────────
    {
      key: 'illumio_labels',
      label: 'Illumio Labels',
      defaultOperator: 'is',
      operators: [{
        key: 'is',
        label: 'is',
        value: {type: 'custom' as const, Editor: IllumioLabelEditor, getString: illumioEditorGetString},
      }],
    },
  ];

  // Destination-only fields
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
            value: makeSuggestionStringList(FQDN_SUGGESTIONS),
          },
          {
            key: 'is_not',
            label: 'does not match',
            value: makeSuggestionStringList(FQDN_SUGGESTIONS),
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
            value: makeSuggestionStringList(K8S_SERVICE_SUGGESTIONS),
          },
          {
            key: 'is_not',
            label: 'is not',
            value: makeSuggestionStringList(K8S_SERVICE_SUGGESTIONS),
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
            value: makeSuggestionStringList(K8S_INGRESS_SUGGESTIONS),
          },
          {
            key: 'is_not',
            label: 'is not',
            value: makeSuggestionStringList(K8S_INGRESS_SUGGESTIONS),
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
            value: makeSuggestionStringList(K8S_GATEWAY_SUGGESTIONS),
          },
          {
            key: 'is_not',
            label: 'is not',
            value: makeSuggestionStringList(K8S_GATEWAY_SUGGESTIONS),
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
