import { useRef, useEffect } from 'react';
import { useAppStore } from '../store/userStore';
import { ChatView } from './ChatView';
import { IdleView } from './IdleView';
import { WaitingView } from './WaitingView';

import { getSignalingUrl } from '../lib/signaling';
import { createPeerConnection, handleIceCandidate } from '../lib/webrtc';
import { sendFile, CHUNK_SIZE } from '../lib/fileTransfer';

export default function App() {
    const { appState, roomId, isRoomCreator, connect, addLogEntry } = useAppStore();

    const wsRef = useRef<WebSocket | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const dcRef = useRef<RTCDataChannel | null>(null);

    const fileReceiver = useRef({
        chunks: [] as ArrayBuffer[],
        metadata: null as { name: string; type: string; size: number } | null,
    }).current;

    useEffect(() => {
        if (appState === 'idle') return;

        let isMounted = true;

        const ws = new WebSocket(getSignalingUrl(roomId));
        wsRef.current = ws;

        const setupChannel = (dc: RTCDataChannel) => {
            dc.binaryType = 'arraybuffer';
            dc.bufferedAmountLowThreshold = CHUNK_SIZE;

            dc.onopen = () => {
                if (isMounted) connect();
            };

            dc.onclose = () => {
                addLogEntry('Canal de dados fechado.');
            };

            dc.onerror = (err) => {
                console.error('Erro no canal de dados:', err);
                addLogEntry('Erro no canal de dados.');
            };

            dc.onmessage = (e) => {
                if (!isMounted) return;

                if (typeof e.data === 'string') {
                    try {
                        const message = JSON.parse(e.data);
                        if (message.type === 'chat') {
                            addLogEntry(`Peer: ${message.payload}`);
                        } else if (message.type === 'file-meta' && message.payload?.name && message.payload?.size) {
                            fileReceiver.metadata = message.payload;
                            fileReceiver.chunks = [];
                            if (fileReceiver.metadata) {
                                addLogEntry(`Peer: Recebendo arquivo: ${fileReceiver.metadata.name}`);
                            }
                        }
                    } catch (err) {
                        console.warn('Mensagem JSON inválida:', e.data);
                    }
                } else if (e.data instanceof ArrayBuffer && fileReceiver.metadata) {
                    fileReceiver.chunks.push(e.data);
                    const receivedSize = fileReceiver.chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);

                    if (receivedSize === fileReceiver.metadata.size) {
                        const blob = new Blob(fileReceiver.chunks, { type: fileReceiver.metadata.type });
                        const url = URL.createObjectURL(blob);
                        const fileLogEntry = `__FILE__::${JSON.stringify({ url, name: fileReceiver.metadata.name })}`;
                        addLogEntry(fileLogEntry);
                        fileReceiver.metadata = null;
                        fileReceiver.chunks = [];
                    }
                }
            };

            dcRef.current = dc;
        };

        const setupConnection = async () => {
            const pc = await createPeerConnection();
            pcRef.current = pc;
            handleIceCandidate(pc, ws);

            pc.ondatachannel = (e) => setupChannel(e.channel);

            ws.onmessage = async (msgEvent) => {
                if (!isMounted) return;
                let msg: any;
                try {
                    msg = JSON.parse(msgEvent.data);
                } catch {
                    console.warn('Mensagem WebSocket inválida:', msgEvent.data);
                    return;
                }

                if (msg.status === 'ready' && isRoomCreator) {
                    const dc = pc.createDataChannel('data');
                    setupChannel(dc);
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    ws.send(JSON.stringify({ sdp: pc.localDescription }));
                    return;
                }

                if (msg.sdp) {
                    await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                    if (msg.sdp.type === 'offer') {
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        ws.send(JSON.stringify({ sdp: pc.localDescription }));
                    }
                } else if (msg.ice) {
                    await pc.addIceCandidate(new RTCIceCandidate(msg.ice));
                }
            };
        };

        setupConnection();

        return () => {
            isMounted = false;

            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }

            pcRef.current?.close();
            dcRef.current?.close?.();
        };
    }, [appState, roomId, isRoomCreator, connect, addLogEntry]);

    const handleSendMessage = (message: string) => {
        const dc = dcRef.current;
        if (message && dc && dc.readyState === 'open') {
            dc.send(JSON.stringify({ type: 'chat', payload: message }));
            addLogEntry(`Eu: ${message}`);
        }
    };

    const handleSendFile = async (file: File) => {
        const dc = dcRef.current;
        if (file && dc && dc.readyState === 'open') {
            await sendFile(file, dc, addLogEntry);
        }
    };

    if (appState === 'idle') return <IdleView />;
    if (appState === 'waiting') return <WaitingView />;
    if (appState === 'connected') {
        return <ChatView onSendMessage={handleSendMessage} onSendFile={handleSendFile} />;
    }

    return null;
}
