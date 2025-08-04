package config

// IceServers define servidores STUN usados pelo WebRTC para descoberta de IP público
// Em redes restritivas, você pode adicionar um servidor TURN separadamente.
var IceServers = []map[string]interface{}{
	{ // STUN público do Google, sem credenciais necessárias
		"urls": []string{"stun:stun.l.google.com:19302"},
	},
}
