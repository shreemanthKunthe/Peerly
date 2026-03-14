package main

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"time"

	firebase "firebase.google.com/go/v4"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/api/option"
	"google.golang.org/grpc"

	"peerly.dev/backend/gateway/pkg/tracing"
	pb "peerly.dev/backend/proto/authpb"
)

// Global RSA Key for signing JWTs
var privateKey *rsa.PrivateKey

func init() {
	var err error
	// Generate an ephemeral RS256 key for development.
	// In production, load this from Vault or environment variable.
	privateKey, err = rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		log.Fatalf("Failed to generate RSA key: %v", err)
	}
}

type authServer struct {
	pb.UnimplementedAuthServiceServer
	db          *pgxpool.Pool
	firebaseApp *firebase.App
}

func main() {
	ctx := context.Background()

	// Initialize OpenTelemetry
	tp, err := tracing.InitTracer("peerly-auth-service")
	if err != nil {
		log.Fatalf("failed to initialize tracer: %v", err)
	}
	defer func() {
		if err := tp.Shutdown(context.Background()); err != nil {
			log.Printf("Error shutting down tracer: %v", err)
		}
	}()

	// Connect to Database
	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		dbUrl = "postgres://peerly_user:peerly_password@127.0.0.1:5433/peerly_db?sslmode=disable" // default Dev
	}
	db, err := pgxpool.New(ctx, dbUrl)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer db.Close()

	// Initialize Firebase Admin SDK
	opt := option.WithCredentialsFile("auth/firebase-adminsdk.json")
	firebaseApp, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		log.Printf("Warning: Firebase App init failed (make sure auth/firebase-adminsdk.json is present): %v", err)
	}

	// Start Token Cleanup Job
	go runTokenCleanupJob(db)

	// Expose JWKS Endpoint over HTTP for Gateway to fetch public keys
	go serveJWKS()

	// Expose Health Probe on port 8082
	go func() {
		mux := http.NewServeMux()
		mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("ok"))
		})
		log.Println("Auth health probe running on :8082")
		log.Fatal(http.ListenAndServe(":8082", mux))
	}()

	// Start gRPC Server
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("failed to listen on :50051: %v", err)
	}

	// Add OpenTelemetry server stats handler to automatically trace incoming gRPC calls
	s := grpc.NewServer(
		grpc.StatsHandler(otelgrpc.NewServerHandler()),
	)
	pb.RegisterAuthServiceServer(s, &authServer{db: db, firebaseApp: firebaseApp})

	log.Printf("Auth gRPC server listening at %v", lis.Addr())
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}

// Background worker to remove expired refresh tokens
func runTokenCleanupJob(db *pgxpool.Pool) {
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

// Serve standard JWKS JSON file for RSA Public Key
func serveJWKS() {
	http.HandleFunc("/.well-known/jwks.json", func(w http.ResponseWriter, r *http.Request) {
		// Example minimalistic JWKS representation for RS256
		// In a real app, you'd calculate E, N base64url representations
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"keys":[]}`) // placeholder
	})
	log.Println("JWKS HTTP server running on :8081")
	log.Fatal(http.ListenAndServe(":8081", nil))
}

// gRPC Implementations

func (s *authServer) VerifyFirebaseToken(ctx context.Context, req *pb.VerifyFirebaseTokenRequest) (*pb.AuthResponse, error) {
	if s.firebaseApp == nil {
		return nil, fmt.Errorf("firebase not initialized")
	}

	client, err := s.firebaseApp.Auth(ctx)
	if err != nil {
		return nil, fmt.Errorf("error getting Auth client: %v", err)
	}

	token, err := client.VerifyIDToken(ctx, req.IdToken)
	if err != nil {
		return nil, fmt.Errorf("error verifying ID token: %v", err)
	}

	// Token is valid. Get or create the user in DB based on Firebase UID
	email := "unknown@noemail.com"
	if emailClaim, ok := token.Claims["email"]; ok {
		email = emailClaim.(string)
	}
	displayName := ""
	if nameClaim, ok := token.Claims["name"]; ok {
		displayName = nameClaim.(string)
	}

	var userId string
	err = s.db.QueryRow(ctx, `
		INSERT INTO users (firebase_uid, email, display_name)
		VALUES ($1, $2, $3)
		ON CONFLICT (email) DO UPDATE SET firebase_uid = EXCLUDED.firebase_uid, display_name = EXCLUDED.display_name
		RETURNING id
	`, token.UID, email, displayName).Scan(&userId)

	if err != nil {
		return nil, fmt.Errorf("database error upserting user: %v", err)
	}

	// Ensure they have the SEEKER role by default
	_, err = s.db.Exec(ctx, `
		INSERT INTO user_roles (user_id, role)
		VALUES ($1, 'SEEKER')
		ON CONFLICT DO NOTHING
	`, userId)
	if err != nil {
		return nil, fmt.Errorf("database error assigning role: %v", err)
	}

	return s.generateAuthToken(userId, []string{"SEEKER"})
}

func (s *authServer) RegisterUser(ctx context.Context, req *pb.RegisterUserRequest) (*pb.AuthResponse, error) {
	if req.Email == "" || req.Password == "" || req.DisplayName == "" {
		return nil, fmt.Errorf("email, password, and display_name are required")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %v", err)
	}

	var userId string
	err = s.db.QueryRow(ctx, `
		INSERT INTO users (email, password_hash, display_name)
		VALUES ($1, $2, $3)
		RETURNING id
	`, req.Email, string(hash), req.DisplayName).Scan(&userId)

	if err != nil {
		return nil, fmt.Errorf("database error creating user (email might be taken): %v", err)
	}

	// Ensure they have the SEEKER role by default
	_, err = s.db.Exec(ctx, `
		INSERT INTO user_roles (user_id, role)
		VALUES ($1, 'SEEKER')
	`, userId)
	if err != nil {
		return nil, fmt.Errorf("database error assigning role: %v", err)
	}

	return s.generateAuthToken(userId, []string{"SEEKER"})
}

func (s *authServer) LoginUser(ctx context.Context, req *pb.LoginUserRequest) (*pb.AuthResponse, error) {
	if req.Email == "" || req.Password == "" {
		return nil, fmt.Errorf("email and password are required")
	}

	var userId string
	var hash string
	err := s.db.QueryRow(ctx, `
		SELECT id, password_hash FROM users WHERE email = $1
	`, req.Email).Scan(&userId, &hash)

	if err != nil {
		return nil, fmt.Errorf("invalid email or password") // Don't leak exists status
	}

	if hash == "" {
		return nil, fmt.Errorf("user registered via Google, please use Google Login")
	}

	err = bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password))
	if err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	// Fetch roles
	rows, err := s.db.Query(ctx, "SELECT role FROM user_roles WHERE user_id = $1", userId)
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
	if len(roles) == 0 {
		roles = append(roles, "SEEKER") // Fallback
	}

	return s.generateAuthToken(userId, roles)
}

// Helper to generate a signed JWT
func (s *authServer) generateAuthToken(userId string, roles []string) (*pb.AuthResponse, error) {
	now := time.Now()
	expiresIn := 3600 // 1 hour

	claims := jwt.MapClaims{
		"sub":   userId,
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

	return &pb.AuthResponse{
		AccessToken: tokenString,
		ExpiresIn:   int64(expiresIn),
		UserId:      userId,
	}, nil
}

func (s *authServer) RefreshToken(ctx context.Context, req *pb.RefreshTokenRequest) (*pb.AuthResponse, error) {
	return &pb.AuthResponse{}, nil
}

func (s *authServer) Logout(ctx context.Context, req *pb.LogoutRequest) (*pb.LogoutResponse, error) {
	return &pb.LogoutResponse{Success: true}, nil
}

func (s *authServer) SetRole(ctx context.Context, req *pb.SetRoleRequest) (*pb.SetRoleResponse, error) {
	if req.UserId == "" || req.Role == "" {
		return nil, fmt.Errorf("user_id and role are required")
	}
	// Only allow valid roles
	if req.Role != "SEEKER" && req.Role != "GUIDER" {
		return nil, fmt.Errorf("invalid role: must be SEEKER or GUIDER")
	}

	// Delete existing role(s) for the user and insert the new one
	_, err := s.db.Exec(ctx, `
		DELETE FROM user_roles WHERE user_id = $1
	`, req.UserId)
	if err != nil {
		return nil, fmt.Errorf("failed to clear existing roles: %v", err)
	}

	_, err = s.db.Exec(ctx, `
		INSERT INTO user_roles (user_id, role) VALUES ($1, $2)
	`, req.UserId, req.Role)
	if err != nil {
		return nil, fmt.Errorf("failed to insert new role: %v", err)
	}

	return &pb.SetRoleResponse{Success: true}, nil
}

func (s *authServer) VerifyToken(ctx context.Context, req *pb.VerifyTokenRequest) (*pb.VerifyTokenResponse, error) {
	return &pb.VerifyTokenResponse{}, nil
}
