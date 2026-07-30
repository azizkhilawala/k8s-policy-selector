import {render, screen, fireEvent} from '@testing-library/react';
import {AddRulePanel} from '../../src/components/PolicySelector';

describe('AddRulePanel', () => {
  it('renders all required fields', () => {
    render(<AddRulePanel onSave={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('Add Rule')).toBeInTheDocument();
    expect(screen.getByText('* Rule Type')).toBeInTheDocument();
    expect(screen.getByText('* Source Scope Type')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add source selector...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add destination selector...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add port range...')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    render(<AddRulePanel onSave={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onSave when Save is clicked', () => {
    const onSave = vi.fn();
    render(<AddRulePanel onSave={onSave} onCancel={() => {}} />);
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ruleType: 'allow', sourceScopeType: 'intra_scope'}),
    );
  });
});
