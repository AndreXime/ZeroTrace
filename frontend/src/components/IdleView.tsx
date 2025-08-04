import { useAppStore } from '../store/userStore';

export function IdleView() {
    // Pega o estado de erro e as ações da store
    const { inputRoomId, error, setInputRoomId, startCreateRoom, startJoinRoom } = useAppStore();

    return (
        <div className="p-4 flex items-center justify-center">
            <div className="flex flex-col items-center gap-6 text-xl w-full max-w-lg">
                {error && (
                    <div className="w-full p-3 bg-red-800 border border-red-600 text-red-100 rounded-lg text-center text-base">
                        {error}
                    </div>
                )}

                <button
                    className="w-full px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition text-slate-100 font-semibold"
                    onClick={startCreateRoom}
                >
                    Criar Nova Sala
                </button>
                <div className="flex items-center w-full gap-2">
                    <hr className="flex-grow border-slate-600" />
                    <span className="text-slate-400">ou</span>
                    <hr className="flex-grow border-slate-600" />
                </div>
                <div className="flex gap-3 w-full">
                    <input
                        className="flex-grow px-4 py-2 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={inputRoomId}
                        onChange={(e) => setInputRoomId(e.target.value)}
                        placeholder="ID da sala"
                    />
                    <button
                        className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 transition text-slate-100"
                        onClick={startJoinRoom}
                    >
                        Entrar
                    </button>
                </div>
            </div>
        </div>
    );
}
