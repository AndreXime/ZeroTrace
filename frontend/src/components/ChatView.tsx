import { useRef } from 'react';
import { useAppStore } from '../store/userStore';
import { Upload } from 'lucide-react';

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
                    <div
                        key={index}
                        className={`text-sm font-mono p-2 rounded-md max-w-1/2 break-words bg-gray-700 self-start`}
                    >
                        Anônimo enviou um arquivo:{' '}
                        <a href={fileData.url} download={fileData.name} className="text-blue-400 hover:underline">
                            {fileData.name}
                        </a>
                    </div>
                );
            } catch {
                return null;
            }
        }

        // Renderização normal de mensagem
        return (
            <div
                key={index}
                className={`text-sm font-mono p-2 rounded-md max-w-1/2 break-words ${
                    entry.startsWith('Eu:') ? 'bg-indigo-900 self-end' : 'bg-gray-700 self-start'
                }`}
            >
                {entry}
            </div>
        );
    };

    /*return (
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
                    <Upload />
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
    );*/
    return (
        <main className="container mx-auto bg-[#2d3748] rounded-lg shadow-2xl flex flex-col h-120">
            <div className="text-center py-3 px-4 border-b border-gray-600">
                <p>
                    Conectado na sala:{' '}
                    <span className="font-semibold text-white bg-gray-900/50 px-2 py-1 rounded">{roomId}</span>
                </p>
            </div>

            <div id="chat-box" className="flex-1 p-6 space-y-4 overflow-y-auto h-100 chat-box flex flex-col-reverse">
                {log.slice().reverse().map(renderLogEntry)}
            </div>

            <div className="p-4 bg-gray-800/50 rounded-b-lg">
                <div className="flex items-center bg-[#1a202c] rounded-lg px-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
                    >
                        <Upload />
                    </button>
                    <input
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        type="file"
                        id="fileInput"
                        className="hidden"
                    />

                    <input
                        type="text"
                        placeholder="Digite sua mensagem e pressione Enter"
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent p-3 text-white placeholder-gray-500 focus:outline-none"
                    />
                </div>
            </div>
        </main>
    );
}
