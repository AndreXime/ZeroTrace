import { useState } from 'react';
import { useAppStore } from '../store/userStore';

export function IdleView() {
    const { startCreateRoom, startJoinRoom } = useAppStore();
    const [inputRoomId, setInputRoomId] = useState('');

    return (
        <div className="w-full flex items-center justify-center flex-col">
            <button
                onClick={startCreateRoom}
                className="mb-8 w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-300 shadow-lg"
            >
                Criar Sala
            </button>

            <div className="flex items-center justify-center mb-8">
                <span className="h-px w-20 bg-gray-600"></span>
                <span className="px-4 text-gray-500 font-medium">OU</span>
                <span className="h-px w-20 bg-gray-600"></span>
            </div>

            <div className="flex items-center justify-center w-full max-w-sm mx-auto">
                <input
                    type="text"
                    value={inputRoomId}
                    onChange={(e) => setInputRoomId(e.target.value)}
                    placeholder="Digite o código da sala"
                    className="w-full bg-[#2d3748] border-2 border-gray-600 rounded-l-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors duration-300"
                />
                <button
                    onClick={() => startJoinRoom(inputRoomId)}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-r-lg text-md transition-colors duration-300 border-2 border-l-0 border-gray-600"
                >
                    Entrar
                </button>
            </div>
        </div>
    );
}
