package db

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func Connect(databaseurl string) (*sql.DB, error) {
	db,err := sql.Open("pgx", databaseurl)
	if err != nil {
		return nil,fmt.Errorf("sql.open: %w",err)

	}
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 *time.Minute)

	// fail fast
	ctx,cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()
	
	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("ping: %w",err)
	}

	return db, nil
}
