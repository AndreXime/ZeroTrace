/**
 * Tamanho padrão dos pedaços de arquivo a serem enviados (em bytes).
 */
export const CHUNK_SIZE = 1000 * 1024; // 1 MB

/**
 * Envia um arquivo via WebRTC DataChannel em pedaços (chunks).
 * Controla o envio para não ultrapassar o buffer da conexão.
 *
 * @param file - Arquivo a ser enviado.
 * @param dc - Canal de dados WebRTC.
 * @param addLogEntry - Função de log da aplicação.
 */
export async function sendFile(file: File, dc: RTCDataChannel, addLogEntry: (msg: string) => void): Promise<void> {
    if (!file || !dc) return;

    addLogEntry(`Eu: Enviando arquivo: ${file.name}`);

    // Envia os metadados
    dc.send(
        JSON.stringify({
            type: 'file-meta',
            payload: {
                name: file.name,
                type: file.type,
                size: file.size,
            },
        })
    );

    let buffer: ArrayBuffer;
    try {
        buffer = await file.arrayBuffer();
    } catch (e) {
        addLogEntry(`Erro ao ler o arquivo: ${file.name}`);
        console.error('Erro ao ler arquivo:', e);
        return;
    }

    let offset = 0;

    const sendNextChunk = () => {
        while (offset < buffer.byteLength) {
            const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
            offset += chunk.byteLength;

            try {
                dc.send(chunk);
            } catch (e) {
                console.error('Erro ao enviar pedaço do arquivo:', e);
                return;
            }

            // Aguarda o buffer esvaziar se estiver cheio
            if (dc.bufferedAmount > dc.bufferedAmountLowThreshold) {
                let timeout = setTimeout(() => {
                    console.warn('Timeout: forçando retomada do envio.');
                    sendNextChunk();
                }, 5000);

                dc.onbufferedamountlow = () => {
                    clearTimeout(timeout);
                    dc.onbufferedamountlow = null;
                    sendNextChunk();
                };
                return;
            }
        }

        // Finaliza envio
        addLogEntry(`Eu: Arquivo ${file.name} enviado com sucesso.`);
    };

    sendNextChunk();
}
