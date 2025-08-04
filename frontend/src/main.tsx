import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <header className="text-5xl font-bold flex flex-col text-center gap-6">
            ZeroTrace
            <span className="text-xl font-normal">
                Compartilhe seus arquivos e texto de forma anonima e com privacidade
            </span>
        </header>
        <App />
    </StrictMode>
);
