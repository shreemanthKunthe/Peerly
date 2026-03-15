package auth

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"fmt"
	"log"
	"time"

	firebase "firebase.google.com/go/v4"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
	"strings"
)

// Global RSA key for signing JWTs (ephemeral per process; swap for file/Vault in prod).
var privateKey *rsa.PrivateKey

func init() {
	var err error
	privateKey, err = rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		log.Fatalf("Failed to generate RSA key: %v", err)
	}
}

// AuthResponse is the result returned from every auth operation.
type AuthResponse struct {
	AccessToken string
	ExpiresIn   int64
	UserID      string
}

// Service holds the dependencies for all auth operations.
type Service struct {
	DB          *pgxpool.Pool
	FirebaseApp *firebase.App
}

// New creates a new auth Service.
func New(db *pgxpool.Pool, firebaseApp *firebase.App) *Service {
	return &Service{DB: db, FirebaseApp: firebaseApp}
}

// VerifyFirebaseToken verifies a Firebase ID token and upserts the user in the DB.
func (s *Service) VerifyFirebaseToken(ctx context.Context, idToken string) (*AuthResponse, error) {
	if s.FirebaseApp == nil {
		return nil, fmt.Errorf("firebase not initialized")
	}

	client, err := s.FirebaseApp.Auth(ctx)
	if err != nil {
		return nil, fmt.Errorf("error getting auth client: %v", err)
	}

	token, err := client.VerifyIDToken(ctx, idToken)
	if err != nil {
		return nil, fmt.Errorf("error verifying ID token: %v", err)
	}

	email := "unknown@noemail.com"
	if emailClaim, ok := token.Claims["email"]; ok {
		email = emailClaim.(string)
	}
	displayName := ""
	if nameClaim, ok := token.Claims["name"]; ok {
		displayName = nameClaim.(string)
	}

	var userID string
	err = s.DB.QueryRow(ctx, `
		INSERT INTO users (firebase_uid, email, display_name)
		VALUES ($1, $2, $3)
		ON CONFLICT (email) DO UPDATE SET firebase_uid = EXCLUDED.firebase_uid, display_name = EXCLUDED.display_name
		RETURNING id
	`, token.UID, email, displayName).Scan(&userID)
	if err != nil {
		return nil, fmt.Errorf("database error upserting user: %v", err)
	}

	rows, err := s.DB.Query(ctx, "SELECT role FROM user_roles WHERE user_id = $1", userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch roles: %v", err)
	}
	defer rows.Close()

	var roles []string
	for rows.Next() {
		var role string
		if err := rows.Scan(&role); err == nil {
			roles = append(roles, role)
		}
	}

	return s.generateAuthToken(userID, roles)
}

// RegisterUser creates a new native email/password account.
func (s *Service) RegisterUser(ctx context.Context, email, password, displayName string) (*AuthResponse, error) {
	if email == "" || password == "" || displayName == "" {
		return nil, fmt.Errorf("email, password, and display_name are required")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %v", err)
	}

	var userID string
	err = s.DB.QueryRow(ctx, `
		INSERT INTO users (email, password_hash, display_name)
		VALUES ($1, $2, $3)
		RETURNING id
	`, email, string(hash), displayName).Scan(&userID)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key value") || strings.Contains(err.Error(), "23505") {
			return nil, fmt.Errorf("email already registered")
		}
		return nil, fmt.Errorf("database error creating user: %v", err)
	}

	return s.generateAuthToken(userID, []string{})
}

// LoginUser authenticates a user with email and password.
func (s *Service) LoginUser(ctx context.Context, email, password string) (*AuthResponse, error) {
	if email == "" || password == "" {
		return nil, fmt.Errorf("email and password are required")
	}

	var userID, hash string
	err := s.DB.QueryRow(ctx, `
		SELECT id, COALESCE(password_hash, '') FROM users WHERE email = $1
	`, email).Scan(&userID, &hash)
	if err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	if hash == "" {
		return nil, fmt.Errorf("user registered via Google, please use Google Login")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)); err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	rows, err := s.DB.Query(ctx, "SELECT role FROM user_roles WHERE user_id = $1", userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch roles: %v", err)
	}
	defer rows.Close()

	var roles []string
	for rows.Next() {
		var role string
		if err := rows.Scan(&role); err == nil {
			roles = append(roles, role)
		}
	}
	// Don't auto-assign SEEKER here either

	return s.generateAuthToken(userID, roles)
}

// SetRole updates a user's role in the database.
func (s *Service) SetRole(ctx context.Context, userID, role string) error {
	if userID == "" || role == "" {
		return fmt.Errorf("user_id and role are required")
	}
	if role != "SEEKER" && role != "GUIDER" {
		return fmt.Errorf("invalid role: must be SEEKER or GUIDER")
	}

	_, err := s.DB.Exec(ctx, `DELETE FROM user_roles WHERE user_id = $1`, userID)
	if err != nil {
		return fmt.Errorf("failed to clear existing roles: %v", err)
	}

	_, err = s.DB.Exec(ctx, `INSERT INTO user_roles (user_id, role) VALUES ($1, $2)`, userID, role)
	if err != nil {
		return fmt.Errorf("failed to insert new role: %v", err)
	}

	return nil
}

// RunTokenCleanupJob is a background goroutine that deletes expired refresh tokens.
func RunTokenCleanupJob(db *pgxpool.Pool) {
	ticker := time.NewTicker(24 * time.Hour)
	for {
		<-ticker.C
		ctx := context.Background()
		cmd, err := db.Exec(ctx, "DELETE FROM refresh_tokens WHERE expires_at < NOW()")
		if err != nil {
			log.Printf("Error cleaning up tokens: %v", err)
		} else {
			log.Printf("Cleaned up %d expired refresh tokens", cmd.RowsAffected())
		}
	}
}

// generateAuthToken creates a signed RS256 JWT for the given user.
func (s *Service) generateAuthToken(userID string, roles []string) (*AuthResponse, error) {
	now := time.Now()
	expiresIn := int64(3600)

	claims := jwt.MapClaims{
		"sub":   userID,
		"roles": roles,
		"iat":   now.Unix(),
		"exp":   now.Add(time.Duration(expiresIn) * time.Second).Unix(),
		"iss":   "auth.peerly.dev",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	tokenString, err := token.SignedString(privateKey)
	if err != nil {
		return nil, fmt.Errorf("failed to sign token: %v", err)
	}

	return &AuthResponse{
		AccessToken: tokenString,
		ExpiresIn:   expiresIn,
		UserID:      userID,
	}, nil
}
