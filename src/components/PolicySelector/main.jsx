import {createRoot} from 'react-dom/client';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import PolicySelectorApp from './PolicySelectorApp';

const root = createRoot(document.getElementById('root'));
root.render(<PolicySelectorApp />);
