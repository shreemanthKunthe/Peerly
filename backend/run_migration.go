package main

import (
	"context"
	"log"
	"os"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	dbUrl := "postgres://peerly_user:peerly_password@127.0.0.1:5433/peerly_db?sslmode=disable" // default Dev

	ctx := context.Background()
	db, err := pgxpool.New(ctx, dbUrl)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer db.Close()

	sqlBytes, err := os.ReadFile("db/init.sql")
	if err != nil {
		log.Fatalf("Failed to read init.sql: %v", err)
	}

	sql := string(sqlBytes)
	statements := strings.Split(sql, ";")

	for _, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" || strings.HasPrefix(stmt, "--") {
			continue
		}

		_, err := db.Exec(ctx, stmt)
		if err != nil {
			log.Printf("Warning: Query failed: %v", err)
		} else {
			log.Println("Executed statement.")
		}
	}

	log.Println("Database schema successfully applied!")
}
