package database

import (
	"database/sql"
	"log"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

// InitDB inicializa a conexão com o banco de dados e cria a tabela de salas.
func InitDB(dataSourceName string) {
	var err error
	DB, err = sql.Open("sqlite3", dataSourceName)
	if err != nil {
		log.Fatalf("Erro ao abrir o banco de dados: %v", err)
	}

	createTableSQL := `
		CREATE TABLE IF NOT EXISTS rooms (
		"id" TEXT NOT NULL PRIMARY KEY,
		"peer_count" INTEGER NOT NULL,
		"created_at" DATETIME NOT NULL );`

	_, err = DB.Exec(createTableSQL)
	if err != nil {
		log.Fatalf("Erro ao criar a tabela de salas: %v", err)
	}
	log.Println("Banco de dados SQLite inicializado e tabela 'rooms' pronta.")
}

// CreateRoom insere uma nova sala no banco de dados com contagem de peers zerada.
func CreateRoom(id string) error {
	_, err := DB.Exec("INSERT INTO rooms (id, peer_count, created_at) VALUES (?, 0, ?)", id, time.Now())
	return err
}

// GetRoomState consulta o estado de uma sala (se existe e quantos peers tem).
func GetRoomState(id string) (peerCount int, exists bool, err error) {
	err = DB.QueryRow("SELECT peer_count FROM rooms WHERE id = ?", id).Scan(&peerCount)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, false, nil // Sala não existe, mas não é um erro de aplicação.
		}
		return 0, false, err // Erro real do banco de dados.
	}
	return peerCount, true, nil
}

// AddPeerToRoom incrementa a contagem de peers de uma sala de forma atômica.
// Retorna o novo número de peers.
func AddPeerToRoom(tx *sql.Tx, id string) (int, error) {
	var currentPeers int
	// Trava a linha para a transação
	err := tx.QueryRow("SELECT peer_count FROM rooms WHERE id = ?", id).Scan(&currentPeers)
	if err != nil {
		return 0, err
	}

	if currentPeers >= 2 {
		return currentPeers, sql.ErrConnDone // Usamos um erro para sinalizar que a sala está cheia
	}

	newPeerCount := currentPeers + 1
	_, err = tx.Exec("UPDATE rooms SET peer_count = ? WHERE id = ?", newPeerCount, id)
	return newPeerCount, err
}

// RemovePeerFromRoom decrementa a contagem de peers e deleta a sala se ficar vazia.
func RemovePeerFromRoom(id string) error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var currentPeers int
	err = tx.QueryRow("SELECT peer_count FROM rooms WHERE id = ?", id).Scan(&currentPeers)
	if err != nil {
		// Se a sala não for encontrada, não há o que fazer.
		if err == sql.ErrNoRows {
			return nil
		}
		return err
	}

	if currentPeers <= 1 {
		// Se for o último peer, deleta a sala.
		_, err = tx.Exec("DELETE FROM rooms WHERE id = ?", id)
	} else {
		// Caso contrário, apenas decrementa.
		_, err = tx.Exec("UPDATE rooms SET peer_count = peer_count - 1 WHERE id = ?", id)
	}

	if err != nil {
		return err
	}

	return tx.Commit()
}
