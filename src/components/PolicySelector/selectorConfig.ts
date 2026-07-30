// Copyright (c) Meta Platforms, Inc. and affiliates.

import type {PowerSearchConfig} from '@astryxdesign/core/PowerSearch';
import K8sExpressionEditor, {k8sEditorGetString} from './K8sExpressionEditor';
import CloudResourceEditor, {cloudResourceGetString} from './CloudResourceEditor';
import PortRangeEditor, {portRangeGetString} from './PortRangeEditor';
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

export function buildSelectorConfig(side: SelectorSide): PowerSearchConfig {
  const isDestination = side === 'destination';

  const fields: Array<PowerSearchConfig['fields'][number]> = [
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
