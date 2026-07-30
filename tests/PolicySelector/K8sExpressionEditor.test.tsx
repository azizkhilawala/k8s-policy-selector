import {render, screen, fireEvent} from '@testing-library/react';
import K8sExpressionEditor, {
  serializeK8sEditor,
  deserializeK8sEditor,
  k8sEditorGetString,
} from '../../src/components/PolicySelector/K8sExpressionEditor';

describe('serializeK8sEditor / deserializeK8sEditor', () => {
  it('round-trips a value', () => {
    const val = {
      namespaceExpressions: [{key: 'env', operator: 'eq' as const, values: ['prod']}],
      workloadExpressions: [{key: 'app', operator: 'eq' as const, values: ['frontend']}],
    };
    expect(deserializeK8sEditor(serializeK8sEditor(val))).toEqual(val);
  });

  it('returns defaults for null input', () => {
    const result = deserializeK8sEditor(null);
    expect(result.namespaceExpressions).toHaveLength(0);
    expect(result.workloadExpressions).toHaveLength(1);
  });

  it('handles legacy format with scope + expressions', () => {
    // Old format had { scope, expressions } — should be migrated to workload
    const legacyJson = JSON.stringify({scope: 'workload', expressions: [{key: 'app', operator: 'eq', values: ['frontend']}]});
    const result = deserializeK8sEditor(legacyJson);
    expect(result.workloadExpressions).toHaveLength(1);
    expect(result.workloadExpressions[0].key).toBe('app');
  });
});

describe('k8sEditorGetString', () => {
  it('formats eq operator in workload expressions', () => {
    const s = serializeK8sEditor({
      namespaceExpressions: [],
      workloadExpressions: [{key: 'app', operator: 'eq', values: ['frontend']}],
    });
    expect(k8sEditorGetString(s)).toBe('pod: app=frontend');
  });

  it('formats exists operator', () => {
    const s = serializeK8sEditor({
      namespaceExpressions: [],
      workloadExpressions: [{key: 'app', operator: 'exists', values: []}],
    });
    expect(k8sEditorGetString(s)).toBe('pod: app=*');
  });

  it('formats notexists operator', () => {
    const s = serializeK8sEditor({
      namespaceExpressions: [],
      workloadExpressions: [{key: 'canary', operator: 'notexists', values: []}],
    });
    expect(k8sEditorGetString(s)).toBe('pod: !canary');
  });

  it('formats in operator', () => {
    const s = serializeK8sEditor({
      namespaceExpressions: [],
      workloadExpressions: [{key: 'tier', operator: 'in', values: ['db', 'cache']}],
    });
    expect(k8sEditorGetString(s)).toBe('pod: tier in [db,cache]');
  });

  it('joins multiple expressions with &', () => {
    const s = serializeK8sEditor({
      namespaceExpressions: [],
      workloadExpressions: [
        {key: 'app', operator: 'eq', values: ['frontend']},
        {key: 'canary', operator: 'notexists', values: []},
      ],
    });
    expect(k8sEditorGetString(s)).toBe('pod: app=frontend & !canary');
  });

  it('formats both namespace and workload expressions', () => {
    const s = serializeK8sEditor({
      namespaceExpressions: [{key: 'env', operator: 'eq', values: ['production']}],
      workloadExpressions: [{key: 'app', operator: 'eq', values: ['frontend']}],
    });
    expect(k8sEditorGetString(s)).toBe('ns: env=production; pod: app=frontend');
  });
});

describe('K8sExpressionEditor component', () => {
  it('renders namespace and workload sections', () => {
    render(<K8sExpressionEditor onChange={() => {}} placeholder="" value={null} />);
    expect(screen.getByText('Namespace Labels')).toBeInTheDocument();
    expect(screen.getByText('Workload Labels')).toBeInTheDocument();
  });

  it('renders one expression row in workload section by default', () => {
    render(<K8sExpressionEditor onChange={() => {}} placeholder="" value={null} />);
    // Default state has 0 ns expressions (no rows) + 1 workload expression (1 row)
    expect(screen.getAllByLabelText('Key')).toHaveLength(1);
  });

  it('calls onChange when key is typed', () => {
    const onChange = vi.fn();
    render(<K8sExpressionEditor onChange={onChange} placeholder="" value={null} />);
    fireEvent.change(screen.getByLabelText('Key'), {target: {value: 'env'}});
    expect(onChange).toHaveBeenCalled();
  });

  it('adds a second expression in workload section on Add button click', () => {
    render(<K8sExpressionEditor onChange={() => {}} placeholder="" value={null} />);
    // "Workload Labels" section has the Add button — the NS section shows "No label expressions"
    const addButtons = screen.getAllByText('+ Add expression');
    // Click the workload-section Add button (second one, after namespace's)
    fireEvent.click(addButtons[addButtons.length - 1]);
    expect(screen.getAllByLabelText('Key')).toHaveLength(2);
  });
});
