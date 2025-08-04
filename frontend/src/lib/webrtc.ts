/**
 * Cria uma nova instância de RTCPeerConnection usando ICE servers fornecidos por API.
 *
 * @returns Uma conexão WebRTC configurada.
 */
export async function createPeerConnection(): Promise<RTCPeerConnection> {
    try {
        const res = await fetch('/ice-servers');
        if (!res.ok) throw new Error('Erro ao buscar ICE servers');
        const config = await res.json();
        return new RTCPeerConnection(config);
    } catch (err) {
        console.error('Erro ao criar conexão WebRTC:', err);
        return new RTCPeerConnection(); // fallback sem config
    }
}

/**
 * Envia candidatos ICE recebidos pelo RTCPeerConnection via WebSocket.
 *
 * @param pc - PeerConnection ativo.
 * @param ws - WebSocket de sinalização.
 */
export function handleIceCandidate(pc: RTCPeerConnection, ws: WebSocket): void {
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            try {
                ws.send(JSON.stringify({ ice: event.candidate }));
            } catch (err) {
                console.error('Erro ao enviar candidato ICE:', err);
            }
        }
    };
}
