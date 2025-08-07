import { create } from 'zustand';

type AppState = 'idle' | 'waiting' | 'connected';

interface AppStore {
    // State
    appState: AppState;
    roomId: string;
    isRoomCreator: boolean;
    log: string[];
    error: string | null;

    // Actions
    startCreateRoom: () => Promise<void>;
    startJoinRoom: (roomId: string) => void;
    connect: () => void;
    addLogEntry: (entry: string) => void;
    reset: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
    // Estado Inicial
    appState: 'idle',
    roomId: '',
    isRoomCreator: false,
    log: [],
    error: null,

    startCreateRoom: async () => {
        set({ error: null });
        try {
            const response = await fetch('/create-room', { method: 'POST' });
            if (!response.ok) {
                throw new Error(`Falha na requisição: ${response.statusText}`);
            }
            const data = await response.json();

            set({
                roomId: data.roomId,
                isRoomCreator: true,
                appState: 'waiting',
            });
        } catch (error) {
            set({ error: 'Não foi possível criar a sala.' });
        }
    },

    startJoinRoom: async (roomId: string) => {
        if (roomId.trim() === '') {
            return;
        }

        set({ error: null }); // Limpa erros antigos

        try {
            const response = await fetch('/join-room', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ roomId: roomId }),
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('O sala informada não existe.');
                }
                throw new Error('Não foi possível entrar na sala.');
            }

            // Se a resposta for OK, então mudamos o estado
            set({
                roomId: roomId,
                isRoomCreator: false,
                appState: 'waiting',
            });
        } catch (err) {
            if (err instanceof Error) {
                set({ error: err.message });
            } else {
                set({ error: 'Ocorreu um erro desconhecido.' });
            }
        }
    },

    connect: () => set({ appState: 'connected' }),
    addLogEntry: (entry) => set((state) => ({ log: [...state.log, entry] })),
    reset: () =>
        set({
            appState: 'idle',
            roomId: '',
            isRoomCreator: false,
            log: [],
            error: null,
        }),
}));
