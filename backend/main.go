package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	firebase "firebase.google.com/go/v4"
	"github.com/99designs/gqlgen/graphql"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/cors"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"google.golang.org/api/option"

	"peerly.dev/backend/auth"
	"peerly.dev/backend/graph"
	"peerly.dev/backend/graph/model"
	"peerly.dev/backend/middleware"
	"peerly.dev/backend/pkg/tracing"
	"peerly.dev/backend/user"
)

const defaultPort = "8080"

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	ctx := context.Background()

	// ── OpenTelemetry ──────────────────────────────────────────────────────────
	tp, err := tracing.InitTracer("peerly")
	if err != nil {
		log.Fatalf("failed to initialize tracer: %v", err)
	}
	defer func() {
		if err := tp.Shutdown(context.Background()); err != nil {
			log.Printf("Error shutting down tracer: %v", err)
		}
	}()

	// ── Database ───────────────────────────────────────────────────────────────
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://peerly_user:peerly_password@127.0.0.1:5433/peerly_db?sslmode=disable"
	}
	db, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer db.Close()

	// ── Firebase Admin SDK ─────────────────────────────────────────────────────
	// Point FIREBASE_SERVICE_ACCOUNT_JSON env variable at your service-account JSON file.
	var firebaseApp *firebase.App
	firebaseCredPath := os.Getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
	if firebaseCredPath != "" {
		opt := option.WithCredentialsFile(firebaseCredPath)
		firebaseApp, err = firebase.NewApp(ctx, nil, opt)
		if err != nil {
			log.Printf("Warning: Firebase init failed (%v) — Google Sign-In will be unavailable", err)
		}
	} else {
		log.Println("FIREBASE_SERVICE_ACCOUNT_JSON not set — Google Sign-In disabled")
	}

	// ── Services ───────────────────────────────────────────────────────────────
	authSvc := auth.New(db, firebaseApp)
	userSvc := user.New(db)

	// Background token-cleanup job
	go auth.RunTokenCleanupJob(db)

	// ── GraphQL ────────────────────────────────────────────────────────────────
	resolver := &graph.Resolver{
		AuthService: authSvc,
		UserService: userSvc,
	}

	c := graph.Config{Resolvers: resolver}

	// @hasRole directive — enforces role-based access control at the field level
	c.Directives.HasRole = func(ctx context.Context, obj interface{}, next graphql.Resolver, role model.Role) (res interface{}, err error) {
		rolesVal := ctx.Value(middleware.RolesContextKey)
		if rolesVal == nil {
			return nil, fmt.Errorf("access denied: not authenticated")
		}
		roles := rolesVal.([]string)
		for _, r := range roles {
			if r == string(role) {
				return next(ctx)
			}
		}
		return nil, fmt.Errorf("access denied: requires role %s", role)
	}

	srv := handler.NewDefaultServer(graph.NewExecutableSchema(c))

	// Prevent deeply nested / expensive queries
	srv.Use(extension.FixedComplexityLimit(100))

	// Wrap with JWT extraction → rate-limiting → OpenTelemetry HTTP tracing
	graphqlHandler := middleware.JWTMiddleware(srv)
	graphqlHandler = middleware.RateLimitMiddleware(graphqlHandler)
	tracedGraphQLHandler := otelhttp.NewHandler(graphqlHandler, "GraphQL")

	// ── HTTP Routes ────────────────────────────────────────────────────────────
	mux := http.NewServeMux()

	// Health probe (for any load-balancer / orchestrator)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	// GraphQL API
	mux.Handle("/graphql", tracedGraphQLHandler)
	mux.Handle("/playground", playground.Handler("GraphQL Playground", "/graphql"))

	// React SPA — serve the Vite build output (dist/) and fall-back to index.html
	// for client-side routes handled by React Router.
	frontendDistPath := "../dist/spa"
	fs := http.FileServer(http.Dir(frontendDistPath))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if _, err := os.Stat(frontendDistPath + r.URL.Path); os.IsNotExist(err) && r.URL.Path != "/" {
			http.ServeFile(w, r, frontendDistPath+"/index.html")
			return
		}
		fs.ServeHTTP(w, r)
	})

	log.Printf("Peerly monolith running on :%s", port)
	log.Printf("  → GraphQL API:     http://localhost:%s/graphql", port)
	log.Printf("  → Playground:      http://localhost:%s/playground", port)
	log.Printf("  → React SPA:       http://localhost:%s/", port)

	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})
	handler := corsMiddleware.Handler(mux)

	log.Fatal(http.ListenAndServe(":"+port, handler))
}
