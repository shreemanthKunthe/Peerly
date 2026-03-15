// migrate is a standalone command that applies db/init.sql to the database.
// Run it once before starting the server:
//
//	go run ./migrate
package main

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://peerly_user:peerly_password@127.0.0.1:5433/peerly_db?sslmode=disable"
	}

	ctx := context.Background()
	db, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer db.Close()

	sqlBytes, err := os.ReadFile("db/init.sql")
	if err != nil {
		log.Fatalf("Failed to read db/init.sql: %v", err)
	}

	if _, err := db.Exec(ctx, string(sqlBytes)); err != nil {
		log.Printf("Warning: migration execution failed: %v", err)
	} else {
		log.Println("Migration completed successfully.")
	}

	log.Println("Migration complete.")
}
