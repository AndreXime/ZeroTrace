package server

import (
	"log"
	"sync"
	"time"

	"GhostChat/internal/database" // <-- Importe
	"GhostChat/internal/types"
)

// O Room struct agora representa apenas as conexões ativas
type Room struct {
	Peers []*types.Peer
	Lock  sync.Mutex
}

// Este mapa é para as salas ATIVAS com conexões WebSocket
var (
	inMemoryRooms     = make(map[string]*Room)
	inMemoryRoomsLock sync.Mutex
)

// Pega uma sala do mapa em memória ou cria uma nova se não existir.
func getOrCreateInMemoryRoom(roomId string) *Room {
	inMemoryRoomsLock.Lock()
	defer inMemoryRoomsLock.Unlock()
	room, exists := inMemoryRooms[roomId]
	if !exists {
		room = &Room{}
		inMemoryRooms[roomId] = room
	}
	return room
}

// Adiciona um peer à estrutura em memória e notifica se a sala estiver pronta.
func addPeerToInMemoryRoom(room *Room, peer *types.Peer) {
	room.Lock.Lock()
	defer room.Lock.Unlock()

	room.Peers = append(room.Peers, peer)

	if len(room.Peers) == 2 {
		log.Printf("Sala '%s' está pronta com 2 peers. Notificando.", getRoomId(room))
		readyMessage := []byte(`{"status":"ready"}`)
		for _, p := range room.Peers {
			p.Send <- readyMessage
		}
	}
}

// Remove o peer da estrutura em memória e atualiza o banco de dados.
func removePeer(roomId string, peerToRemove *types.Peer) {
	inMemoryRoomsLock.Lock()
	room, exists := inMemoryRooms[roomId]
	if !exists {
		inMemoryRoomsLock.Unlock()
		return
	}

	// Remove da sala em memória
	newPeers := make([]*types.Peer, 0)
	for _, p := range room.Peers {
		if p != peerToRemove {
			newPeers = append(newPeers, p)
		}
	}
	room.Peers = newPeers

	// Se a sala em memória ficar vazia, remove do mapa
	if len(room.Peers) == 0 {
		delete(inMemoryRooms, roomId)
	}
	inMemoryRoomsLock.Unlock()

	// Atualiza o banco de dados
	log.Printf("Removendo peer do DB para a sala '%s'", roomId)
	err := database.RemovePeerFromRoom(roomId)
	if err != nil {
		log.Printf("Erro ao remover peer do DB para a sala '%s': %v", roomId, err)
	}
}

// Helper para encontrar o ID de uma sala a partir do ponteiro (para logs)
func getRoomId(room *Room) string {
	inMemoryRoomsLock.Lock()
	defer inMemoryRoomsLock.Unlock()
	for id, r := range inMemoryRooms {
		if r == room {
			return id
		}
	}
	return ""
}

// O cleanup agora pode ser feito diretamente no DB por tempo de criação.
func init() {
	go func() {
		ticker := time.NewTicker(15 * time.Minute)
		for range ticker.C {
			_, err := database.DB.Exec("DELETE FROM rooms WHERE peer_count = 0 AND created_at < ?", time.Now().Add(-15*time.Minute))
			if err != nil {
				log.Printf("Erro ao limpar salas órfãs do DB: %v", err)
			}
		}
	}()
}
