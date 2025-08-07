# GhostChat

Uma chatrom anonima que os usuarios podem trocar mensagens e arquivos sem passar pelo servidor por meio de WebRTC

## Como funciona

### 1. Sinalização (WebSocket)

Quando dois usuários querem se comunicar:

1. Um cliente cria uma **sala** via API.
2. Outro cliente entra na mesma sala.
3. Ambos se conectam ao servidor via **WebSocket**.
4. Eles trocam mensagens de sinalização:
    - `offer`, `answer` e `iceCandidate`.

### 2. Comunicação P2P (WebRTC)

Após a troca de sinalização:

-   Os navegadores tentam se conectar diretamente usando **WebRTC**.
-   Se conseguirem, a comunicação (mensagens, arquivos, etc) acontece **direto entre eles**, **sem passar pelo servidor**.

## Tecnologias utilizadas

**Backend (Go):**

-   `gorilla/websocket` para WebSocket
-   `API REST` para criar/entrar em salas
-   `Banco SQLite` para controlar número de peers por sala

**Frontend (TypeScript + React):**

-   `RTCPeerConnection` para WebRTC
-   `RTCDataChannel` para enviar mensagens
-   `WebSocket` para sinalização
