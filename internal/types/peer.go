package types

import "github.com/gorilla/websocket"

type Peer struct {
	Conn *websocket.Conn
	Send chan []byte
}
