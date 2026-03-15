package middleware

import (
	"context"
	"log"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// contextKey is a private type for context keys to avoid collisions.
type contextKey string

// Context keys for storing user data extracted from the JWT.
const RolesContextKey contextKey = "userRoles"
const SubContextKey contextKey = "userID"

// JWTMiddleware extracts and parses the Bearer token from the Authorization header.
// It injects the user's ID and roles into the request context so resolvers can read them.
// Requests without a token are allowed through — individual resolvers / @hasRole enforce access.
func JWTMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			log.Printf("[JWT] No Authorization header for %s %s", r.Method, r.URL.Path)
			next.ServeHTTP(w, r)
			return
		}

		parts := strings.Split(authHeader, "Bearer ")
		if len(parts) != 2 {
			log.Printf("[JWT] Malformed Bearer token: %s", authHeader)
			http.Error(w, "Malformed token", http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]
		token, _, err := new(jwt.Parser).ParseUnverified(tokenString, jwt.MapClaims{})
		if err != nil {
			log.Printf("[JWT] Parse error: %v", err)
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			ctx := r.Context()
			if sub, ok := claims["sub"].(string); ok {
				log.Printf("[JWT] Authorized user: %s", sub)
				ctx = context.WithValue(ctx, SubContextKey, sub)
			} else {
				log.Printf("[JWT] Warning: 'sub' claim missing or not a string")
			}
			
			if roles, ok := claims["roles"].([]interface{}); ok {
				var roleStrs []string
				for _, role := range roles {
					if strRole, ok := role.(string); ok {
						roleStrs = append(roleStrs, strRole)
					}
				}
				ctx = context.WithValue(ctx, RolesContextKey, roleStrs)
			}
			r = r.WithContext(ctx)
		}

		next.ServeHTTP(w, r)
	})
}
