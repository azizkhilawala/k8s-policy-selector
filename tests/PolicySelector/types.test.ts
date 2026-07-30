import type {SelectorValue, ClusterRef, PortRange, K8sNamespaceValue} from '../../src/components/PolicySelector/types';

describe('types', () => {
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
    const val: SelectorValue = {category: 'k8s_labels', labels: ['app=frontend']};
    expect(val.category).toBe('k8s_labels');
  });

  it('SelectorValue category discriminates illumio_labels', () => {
    const val: SelectorValue = {category: 'illumio_labels', labels: ['Role:web', 'Env:Production']};
    expect(val.category).toBe('illumio_labels');
  });

  it('K8sNamespaceValue supports label mode with expressions', () => {
    const val: K8sNamespaceValue = {
      category: 'k8s_namespace',
      mode: 'label',
      names: [],
      labelExpressions: [{key: 'store', operator: 'In', values: ['retail', 'online']}],
    };
    expect(val.mode).toBe('label');
    expect(val.labelExpressions[0].operator).toBe('In');
  });

  it('K8sNamespaceValue supports wildcard mode', () => {
    const val: K8sNamespaceValue = {
      category: 'k8s_namespace',
      mode: 'wildcard',
      names: [],
      labelExpressions: [],
    };
    expect(val.mode).toBe('wildcard');
  });
});
