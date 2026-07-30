import {render, screen} from '@testing-library/react';
import RuleOptionsSelector from '../../src/components/PolicySelector/RuleOptionsSelector';

describe('RuleOptionsSelector', () => {
  it('renders with no selection', () => {
    render(<RuleOptionsSelector value={[]} onChange={() => {}} />);
    expect(screen.getByText('Rule Options')).toBeInTheDocument();
  });
});
