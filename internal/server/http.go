package server

import (
	"encoding/json"
	"math/rand" // <-- Adicionada importação
	"net/http"
	"strings" // <-- Adicionada importação
	"time"    // <-- Adicionada importação

	"signaling-mvp/internal/config"
	"signaling-mvp/internal/database"
)

func respondJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

func CreateRoom(w http.ResponseWriter, r *http.Request) {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	const idLength = 8
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	var roomId string

	// Loop para garantir que o ID seja único no DB
	for {
		var sb strings.Builder
		sb.Grow(idLength)
		for i := 0; i < idLength; i++ {
			sb.WriteByte(charset[rng.Intn(len(charset))])
		}
		roomId = sb.String()

		// Tenta criar a sala no banco de dados
		err := database.CreateRoom(roomId)
		if err == nil {
			break // Sucesso, ID é único
		}
	}

	respondJSON(w, map[string]string{"roomId": roomId})
}

func JoinRoom(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RoomId string `json:"roomId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.RoomId == "" {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Usa a nova função para pegar o estado da sala do DB
	peerCount, exists, err := database.GetRoomState(req.RoomId)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	// Rejeita se a sala não existir ou estiver cheia
	if !exists || peerCount >= 2 {
		http.Error(w, "Room not found or full", http.StatusNotFound)
		return
	}

	respondJSON(w, map[string]string{"status": "joined"})
}

func GetIceServers(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, config.IceServers)
}
