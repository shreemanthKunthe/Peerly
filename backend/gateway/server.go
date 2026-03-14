package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/99designs/gqlgen/graphql"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/retry"
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"

	"peerly.dev/backend/gateway/graph"
	"peerly.dev/backend/gateway/graph/model"
	"peerly.dev/backend/gateway/middleware"
	"peerly.dev/backend/gateway/pkg/tracing"
	authpb "peerly.dev/backend/proto/authpb"
	userpb "peerly.dev/backend/proto/userpb"
)

const defaultPort = "8080"

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	// Initialize OpenTelemetry
	tp, err := tracing.InitTracer("peerly-gateway")
	if err != nil {
		log.Fatalf("failed to initialize tracer: %v", err)
	}
	defer func() {
		if err := tp.Shutdown(context.Background()); err != nil {
			log.Printf("Error shutting down tracer: %v", err)
		}
	}()

	// Define standard gRPC Retry Options
	retryOpts := []retry.CallOption{
		retry.WithMax(3),
		retry.WithBackoff(retry.BackoffExponential(100 * time.Millisecond)),
		retry.WithCodes(codes.Unavailable, codes.DeadlineExceeded),
	}

	dialOpts := []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithStatsHandler(otelgrpc.NewClientHandler()),                    // Telemetry
		grpc.WithUnaryInterceptor(retry.UnaryClientInterceptor(retryOpts...)), // Backoff Retry
	}

	// Connect to internal Auth gRPC Microservice
	authConn, err := grpc.Dial("localhost:50051", dialOpts...)
	if err != nil {
		log.Fatalf("did not connect to Auth Service: %v", err)
	}
	defer authConn.Close()
	authClient := authpb.NewAuthServiceClient(authConn)

	// Connect to internal User gRPC Microservice
	userConn, err := grpc.Dial("localhost:50052", dialOpts...)
	if err != nil {
		log.Fatalf("did not connect to User Service: %v", err)
	}
	defer userConn.Close()
	userClient := userpb.NewUserServiceClient(userConn)

	resolver := &graph.Resolver{
		AuthClient: authClient,
		UserClient: userClient,
	}

	c := graph.Config{Resolvers: resolver}
	c.Directives.HasRole = func(ctx context.Context, obj interface{}, next graphql.Resolver, role model.Role) (res interface{}, err error) {
		rolesVal := ctx.Value(middleware.RolesContextKey)
		if rolesVal == nil {
			return nil, fmt.Errorf("Access denied")
		}
		roles := rolesVal.([]string)
		for _, r := range roles {
			if r == string(role) {
				return next(ctx)
			}
		}
		return nil, fmt.Errorf("Access denied. Requires role: %s", role)
	}

	srv := handler.NewDefaultServer(graph.NewExecutableSchema(c))

	// Add Query Complexity limit to prevent abuse via deeply nested payloads
	srv.Use(extension.FixedComplexityLimit(100))

	// Wrap the GraphQL handler with OpenTelemetry HTTP instrumentation
	graphqlHandler := middleware.JWTMiddleware(srv)
	tracedGraphQLHandler := otelhttp.NewHandler(graphqlHandler, "GraphQL")

	// Standard health probe for Docker / K8s orchestrators
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	// Setup static file serving for the React SPA (Vite output folder)
	frontendDistPath := "../dist/spa"
	fs := http.FileServer(http.Dir(frontendDistPath))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Serve index.html for any path that doesn't resolve to a real file
		// This is required for React Router to handle client-side URLs
		if _, err := os.Stat(frontendDistPath + r.URL.Path); os.IsNotExist(err) && r.URL.Path != "/" {
			http.ServeFile(w, r, frontendDistPath+"/index.html")
			return
		}
		fs.ServeHTTP(w, r)
	})

	// Add the GraphQL handler over the standard API path
	http.Handle("/graphql", tracedGraphQLHandler)
	http.Handle("/playground", playground.Handler("GraphQL playground", "/graphql"))

	log.Printf("Gateway running on :%s (Serving React App on / and Gateway API on /graphql)", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
