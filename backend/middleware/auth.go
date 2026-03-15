package middleware

import (
	"context"
	"log"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

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
			next.ServeHTTP(w, r)
			return
		}

		parts := strings.Split(authHeader, "Bearer ")
		if len(parts) != 2 {
			log.Printf("[JWT] Malformed Authorization header")
			next.ServeHTTP(w, r)
			return
		}

		tokenString := parts[1]
		token, _, err := new(jwt.Parser).ParseUnverified(tokenString, jwt.MapClaims{})
		if err != nil {
			log.Printf("[JWT] Parse error: %v", err)
			next.ServeHTTP(w, r)
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			ctx := r.Context()
			if sub, ok := claims["sub"].(string); ok {
				log.Printf("[JWT] Authenticated user: %s", sub)
				ctx = context.WithValue(ctx, SubContextKey, sub)
			} else {
				log.Printf("[JWT] No 'sub' claim found in token")
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
		} else {
			log.Printf("[JWT] Could not cast claims to MapClaims")
		}

		next.ServeHTTP(w, r)
	})
}
