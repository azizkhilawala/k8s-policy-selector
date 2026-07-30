// tests/PolicySelector/K8sExpressionEditor.test.tsx
import {render, screen, fireEvent} from '@testing-library/react';
import K8sExpressionEditor, {
  serializeK8sEditor,
  deserializeK8sEditor,
  k8sEditorGetString,
} from '../../src/components/PolicySelector/K8sExpressionEditor';

describe('serializeK8sEditor / deserializeK8sEditor', () => {
  it('round-trips a value', () => {
    const val = {scope: 'workload' as const, expressions: [{key: 'app', operator: 'eq' as const, values: ['frontend']}]};
    expect(deserializeK8sEditor(serializeK8sEditor(val))).toEqual(val);
  });

  it('returns defaults for null input', () => {
    const result = deserializeK8sEditor(null);
    expect(result.scope).toBe('workload');
    expect(result.expressions).toHaveLength(1);
  });
});

describe('k8sEditorGetString', () => {
  it('formats eq operator', () => {
    const s = serializeK8sEditor({scope: 'workload', expressions: [{key: 'app', operator: 'eq', values: ['frontend']}]});
    expect(k8sEditorGetString(s)).toBe('app=frontend');
  });

  it('formats exists operator', () => {
    const s = serializeK8sEditor({scope: 'workload', expressions: [{key: 'app', operator: 'exists', values: []}]});
    expect(k8sEditorGetString(s)).toBe('app=*');
  });

  it('formats notexists operator', () => {
    const s = serializeK8sEditor({scope: 'workload', expressions: [{key: 'canary', operator: 'notexists', values: []}]});
    expect(k8sEditorGetString(s)).toBe('!canary');
  });

  it('formats in operator', () => {
    const s = serializeK8sEditor({scope: 'workload', expressions: [{key: 'tier', operator: 'in', values: ['db', 'cache']}]});
    expect(k8sEditorGetString(s)).toBe('tier in [db,cache]');
  });

  it('joins multiple expressions with &', () => {
    const s = serializeK8sEditor({
      scope: 'workload',
      expressions: [
        {key: 'app', operator: 'eq', values: ['frontend']},
        {key: 'canary', operator: 'notexists', values: []},
      ],
    });
    expect(k8sEditorGetString(s)).toBe('app=frontend & !canary');
  });
});

describe('K8sExpressionEditor component', () => {
  it('renders scope toggle and first expression row', () => {
    render(<K8sExpressionEditor onChange={() => {}} placeholder="" value={null} />);
    expect(screen.getByText('Namespace')).toBeInTheDocument();
    expect(screen.getByText('Workload')).toBeInTheDocument();
    expect(screen.getByLabelText('Key')).toBeInTheDocument();
  });

  it('calls onChange when key is typed', () => {
    const onChange = vi.fn();
    render(<K8sExpressionEditor onChange={onChange} placeholder="" value={null} />);
    fireEvent.change(screen.getByLabelText('Key'), {target: {value: 'env'}});
    expect(onChange).toHaveBeenCalled();
  });

  it('adds a second expression on Add button click', () => {
    render(<K8sExpressionEditor onChange={() => {}} placeholder="" value={null} />);
    fireEvent.click(screen.getByText('+ Add expression'));
    expect(screen.getAllByLabelText('Key')).toHaveLength(2);
  });
});
