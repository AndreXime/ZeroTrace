import { useRef } from 'react';
import { useAppStore } from '../store/userStore';

interface ChatViewProps {
    onSendMessage: (message: string) => void;
    onSendFile: (file: File) => void; // <-- Nova prop para enviar arquivos
}

export function ChatView({ onSendMessage, onSendFile }: ChatViewProps) {
    const { roomId, log } = useAppStore();
    const fileInputRef = useRef<HTMLInputElement>(null); // <-- Ref para o input de arquivo

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const input = e.target as HTMLInputElement;
            const message = input.value;
            if (message) {
                onSendMessage(message);
                input.value = '';
            }
        }
    };

    // ====================== INÍCIO DA CORREÇÃO ======================
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onSendFile(file);
        }
        // Limpa o input para permitir selecionar o mesmo arquivo novamente
        e.target.value = '';
    };

    const renderLogEntry = (entry: string, index: number) => {
        // Verifica se a entrada do log é um link de arquivo para renderizar
        if (entry.startsWith('__FILE__::')) {
            try {
                const fileData = JSON.parse(entry.substring('__FILE__::'.length));
                return (
                    <div key={index} className="bg-slate-700 self-start text-sm p-2 rounded-md">
                        <span>Peer enviou um arquivo: </span>
                        <a
                            href={fileData.url}
                            download={fileData.name}
                            className="text-indigo-400 hover:text-indigo-300 font-bold underline"
                        >
                            {fileData.name}
                        </a>
                    </div>
                );
            } catch {
                // Fallback se o JSON for inválido
                return null;
            }
        }

        // Renderização normal de mensagem
        return (
            <div
                key={index}
                className={`text-sm font-mono p-2 rounded-md max-w-1/2 break-words ${
                    entry.startsWith('Eu:') ? 'bg-indigo-900 self-end' : 'bg-slate-700 self-start'
                }`}
            >
                {entry}
            </div>
        );
    };

    return (
        <div className="p-4 flex items-center justify-center w-full flex-col gap-4 h-[50vh]">
            <h2 className="text-2xl font-bold">
                Conectado na sala: <span className="font-mono text-indigo-400">{roomId}</span>
            </h2>
            <div className="w-full bg-slate-900 rounded-lg h-full p-4 overflow-y-auto flex flex-col-reverse gap-3">
                {log.slice().reverse().map(renderLogEntry)}
            </div>
            <div className="flex w-full gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden" // O input fica escondido
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 transition text-slate-100"
                    title="Anexar arquivo"
                >
                    📎
                </button>
                <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem e pressione Enter"
                    autoFocus
                />
            </div>
        </div>
    );
}
