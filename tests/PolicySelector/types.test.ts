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
