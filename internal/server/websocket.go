package server

import (
	"database/sql" // <-- Importe
	"log"
	"net/http"

	"signaling-mvp/internal/database" // <-- Importe
	"signaling-mvp/internal/types"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	roomId := r.URL.Path[len("/ws/"):]
	if roomId == "" {
		http.Error(w, "Room ID inválido", http.StatusBadRequest)
		return
	}

	// Inicia uma transação com o banco de dados
	tx, err := database.DB.Begin()
	if err != nil {
		log.Printf("Erro ao iniciar transação: %v", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Adiciona peer de forma transacional e verifica se a sala está cheia
	_, err = database.AddPeerToRoom(tx, roomId)
	if err != nil {
		if err == sql.ErrConnDone { // Erro que usamos para "sala cheia"
			log.Printf("Conexão recusada para a sala '%s': sala cheia.", roomId)
			http.Error(w, "Room is full", http.StatusForbidden)
		} else if err == sql.ErrNoRows { // Sala não existe no DB
			log.Printf("Conexão recusada para a sala '%s': sala não existe.", roomId)
			http.Error(w, "Room not found", http.StatusNotFound)
		} else {
			log.Printf("Erro ao adicionar peer no DB: %v", err)
			http.Error(w, "Server error", http.StatusInternalServerError)
		}
		return
	}

	// Se tudo deu certo no DB, faz o upgrade da conexão
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		// Se o upgrade falhar, a transação será revertida pelo defer
		return
	}

	// Somente comita a transação após o sucesso do upgrade
	if err := tx.Commit(); err != nil {
		log.Printf("Erro ao comitar transação: %v", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	// Pega a sala da memória (ou cria se for a primeira conexão) e adiciona o peer
	room := getOrCreateInMemoryRoom(roomId)
	peer := &types.Peer{Conn: conn, Send: make(chan []byte, 256)}
	addPeerToInMemoryRoom(room, peer)

	go readLoop(roomId, peer, room)
	go writeLoop(peer)
}

// ... readLoop, writeLoop e broadcastToOthers permanecem os mesmos ...
func readLoop(roomId string, peer *types.Peer, room *Room) {
	defer func() {
		peer.Conn.Close()
		// Remove o peer da sala em memória E do banco de dados
		removePeer(roomId, peer)
	}()

	for {
		_, msg, err := peer.Conn.ReadMessage()
		if err != nil {
			if !websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Peer desconectado da sala '%s'.", roomId)
			} else {
				log.Printf("Erro lendo mensagem na sala '%s': %v", roomId, err)
			}
			break
		}
		broadcastToOthers(room, peer, msg)
	}
}

func writeLoop(peer *types.Peer) {
	for msg := range peer.Send {
		err := peer.Conn.WriteMessage(websocket.TextMessage, msg)
		if err != nil {
			log.Println("Erro escrevendo mensagem:", err)
			break
		}
	}
}

func broadcastToOthers(room *Room, sender *types.Peer, msg []byte) {
	room.Lock.Lock()
	defer room.Lock.Unlock()
	for _, p := range room.Peers {
		if p != sender {
			select {
			case p.Send <- msg:
			default:
				log.Printf("Canal de envio do peer cheio. Mensagem descartada.")
			}
		}
	}
}
