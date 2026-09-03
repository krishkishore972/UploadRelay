package main

import (
	"errors"
	"fmt"
	"log"
	"os"

	"go-api/internal/config"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	if len(os.Args) < 2 {
		log.Fatal("Usage: migrate <up|down>")
	}
	cfg := config.MustLoad()

	m, err := migrate.New(
		"file://migrations",
		cfg.DatabaseUrl,
	)
	if err != nil {
		log.Fatal(err)
	}
	defer m.Close()
	switch os.Args[1] {
	case "up":
		if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
			log.Fatalf("migration up failed: %v", err)
		}
		log.Println("migrations applied")

	case "down":
		if err := m.Steps(-1); err != nil && !errors.Is(err, migrate.ErrNoChange) {
			log.Fatalf("migration down failed: %v", err)
		}
		log.Println("rolled back one migration")

	case "version":
		version, dirty, err := m.Version()
		if err != nil && !errors.Is(err, migrate.ErrNilVersion) {
			log.Fatalf("migration version failed: %v", err)
		}
		log.Printf("version=%d dirty=%v", version, dirty)

	case "force":
		if len(os.Args) < 3 {
			log.Fatal("Usage: go run ./cmd/migrate force <version>")
		}

		version := 0
		if _, err := fmt.Sscanf(os.Args[2], "%d", &version); err != nil {
			log.Fatalf("invalid version: %v", err)
		}

		if err := m.Force(version); err != nil {
			log.Fatalf("force failed: %v", err)
		}
		log.Printf("forced migration version to %d", version)

	default:
		log.Fatal("Usage: go run ./cmd/migrate <up|down|version|force>")
	}
	
}