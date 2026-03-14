package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"google.golang.org/grpc"

	"peerly.dev/backend/gateway/pkg/tracing"
	pb "peerly.dev/backend/proto/userpb"
)

type userServer struct {
	pb.UnimplementedUserServiceServer
	db *pgxpool.Pool
}

func main() {
	ctx := context.Background()

	// Initialize OpenTelemetry
	tp, err := tracing.InitTracer("peerly-user-service")
	if err != nil {
		log.Fatalf("failed to initialize tracer: %v", err)
	}
	defer func() {
		if err := tp.Shutdown(context.Background()); err != nil {
			log.Printf("Error shutting down tracer: %v", err)
		}
	}()

	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		dbUrl = "postgres://peerly_user:peerly_password@127.0.0.1:5433/peerly_db?sslmode=disable" // default Dev
	}

	db, err := pgxpool.New(ctx, dbUrl)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer db.Close()

	// Expose Health Probe on port 8083
	go func() {
		mux := http.NewServeMux()
		mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("ok"))
		})
		log.Println("User health probe running on :8083")
		log.Fatal(http.ListenAndServe(":8083", mux))
	}()

	lis, err := net.Listen("tcp", ":50052")
	if err != nil {
		log.Fatalf("failed to listen on :50052: %v", err)
	}

	// Add OpenTelemetry server stats handler to automatically trace incoming gRPC calls
	s := grpc.NewServer(
		grpc.StatsHandler(otelgrpc.NewServerHandler()),
	)
	pb.RegisterUserServiceServer(s, &userServer{db: db})
	log.Printf("User gRPC server listening at %v", lis.Addr())
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}

func (s *userServer) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.UserResponse, error) {
	// Query Postgres to return User Core object
	return &pb.UserResponse{Id: req.UserId}, nil
}

func (s *userServer) UpsertProfile(ctx context.Context, req *pb.UpsertProfileRequest) (*pb.ProfileResponse, error) {
	// UPSERT to Postgres profiles table
	return &pb.ProfileResponse{UserId: req.UserId, DisplayName: req.DisplayName}, nil
}

func (s *userServer) GetProfile(ctx context.Context, req *pb.GetProfileRequest) (*pb.ProfileResponse, error) {
	return &pb.ProfileResponse{UserId: req.UserId}, nil
}
