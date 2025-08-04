/**
 * Gera a URL do WebSocket de sinalização com base na origem atual e roomId.
 * Usa ws:// para http e wss:// para https.
 *
 * @param roomId - ID da sala para conexão.
 * @returns URL do WebSocket de sinalização.
 */
export function getSignalingUrl(roomId: string): string {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = location.host;
    return `${protocol}//${host}/ws/${roomId}`;
}
