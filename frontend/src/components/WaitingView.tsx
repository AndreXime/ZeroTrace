import { useState } from 'react';
import { useAppStore } from '../store/userStore';

export function WaitingView() {
    const { roomId } = useAppStore();

    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(roomId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Erro ao copiar:', err);
        }
    };

    return (
        <div className="w-full p-4 flex items-center flex-col justify-center text-center gap-5">
            <p className="text-2xl font-bold">Aguardando outro participante...</p>
            <p className="text-lg">Compartilhe o ID da sala:</p>
            <div
                title="Clique para copiar"
                onClick={handleCopy}
                className="p-4 bg-slate-700 rounded-lg font-mono text-indigo-400 text-2xl animate-pulse cursor-pointer"
            >
                {roomId}
            </div>
            {copied && <p className="text-sm text-green-400">ID copiado!</p>}
        </div>
    );
}
