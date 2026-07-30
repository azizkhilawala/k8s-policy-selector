import {render, screen, fireEvent} from '@testing-library/react';
import {AddRulePanel} from '../../src/components/PolicySelector';

describe('AddRulePanel', () => {
  it('renders all required fields', () => {
    render(<AddRulePanel onSave={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('Add Rule')).toBeInTheDocument();
    expect(screen.getByText('* Sources')).toBeInTheDocument();
    expect(screen.getByText('* Destinations')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Select Sources...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Select Destinations...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Select Source Process / Service...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Select Destination Services...')).toBeInTheDocument();
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
