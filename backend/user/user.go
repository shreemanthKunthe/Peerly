package user

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// UserRecord represents the core user row from the database.
type UserRecord struct {
	ID      string
	Email   string
	GoogleID string
	Roles   []string
}

// ProfileRecord represents a user's extended profile.
type ProfileRecord struct {
	UserID      string
	DisplayName string
	Bio         string
	AvatarURL   string
}

// Service holds the database pool for user operations.
type Service struct {
	DB *pgxpool.Pool
}

// New creates a new user Service.
func New(db *pgxpool.Pool) *Service {
	return &Service{DB: db}
}

// GetUser fetches a user's core record plus their roles from the database.
func (s *Service) GetUser(ctx context.Context, userID string) (*UserRecord, error) {
	var u UserRecord
	err := s.DB.QueryRow(ctx, `
		SELECT id, email, COALESCE(firebase_uid, '')
		FROM users WHERE id = $1
	`, userID).Scan(&u.ID, &u.Email, &u.GoogleID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %v", err)
	}

	rows, err := s.DB.Query(ctx, "SELECT role FROM user_roles WHERE user_id = $1", userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch roles: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var role string
		if err := rows.Scan(&role); err == nil {
			u.Roles = append(u.Roles, role)
		}
	}

	return &u, nil
}

// UpsertProfile creates or updates a user's profile in the users table.
func (s *Service) UpsertProfile(ctx context.Context, userID, displayName, bio string) (*ProfileRecord, error) {
	_, err := s.DB.Exec(ctx, `
		UPDATE users
		SET display_name = $2, updated_at = NOW()
		WHERE id = $1
	`, userID, displayName)
	if err != nil {
		return nil, fmt.Errorf("failed to upsert profile: %v", err)
	}

	return &ProfileRecord{
		UserID:      userID,
		DisplayName: displayName,
		Bio:         bio,
	}, nil
}

// GetProfile fetches a user's profile fields.
func (s *Service) GetProfile(ctx context.Context, userID string) (*ProfileRecord, error) {
	var p ProfileRecord
	err := s.DB.QueryRow(ctx, `
		SELECT id, COALESCE(display_name, ''), COALESCE(avatar_url, '')
		FROM users WHERE id = $1
	`, userID).Scan(&p.UserID, &p.DisplayName, &p.AvatarURL)
	if err != nil {
		return nil, fmt.Errorf("profile not found: %v", err)
	}
	return &p, nil
}
