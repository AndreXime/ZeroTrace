package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"path"
	"signaling-mvp/internal/database"
	"signaling-mvp/internal/server"
)

//go:embed frontend/dist/**
var publicFS embed.FS

func main() {
	database.InitDB("./database.db")
	// API endpoints
	http.HandleFunc("/create-room", server.CreateRoom)
	http.HandleFunc("/join-room", server.JoinRoom)
	http.HandleFunc("/ice-servers", server.GetIceServers)
	// WebSocket signaling
	http.HandleFunc("/ws/", server.HandleWebSocket)

	// Sub-FS to frontend/dist
	distFS, err := fs.Sub(publicFS, "frontend/dist")
	if err != nil {
		log.Fatal(err)
	}

	// Serve index.html at root and other files by name
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			serveFile(w, r, distFS, "index.html")
			return
		}
		file := path.Clean(r.URL.Path[1:])
		serveFile(w, r, distFS, file)
	})

	log.Println("Servidor rodando em :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func serveFile(w http.ResponseWriter, r *http.Request, fsys fs.FS, name string) {
	data, err := fs.ReadFile(fsys, name)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", detectContentType(name))
	w.Write(data)
}

func detectContentType(name string) string {
	switch path.Ext(name) {
	case ".html":
		return "text/html; charset=utf-8"
	case ".js":
		return "application/javascript"
	case ".css":
		return "text/css"
	case ".svg":
		return "image/svg+xml"
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	default:
		return "application/octet-stream"
	}
}
