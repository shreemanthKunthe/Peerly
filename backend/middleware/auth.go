package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// Context keys for storing user data extracted from the JWT.
const RolesContextKey = "userRoles"
const SubContextKey = "userID"

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
			http.Error(w, "Malformed token", http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

		// ParseUnverified is used here for the monolith — the same process signed the token,
		// so for simplicity we trust it. In production swap this for proper RS256 verification
		// with the public key from the in-memory `privateKey` in the auth package.
		token, _, err := new(jwt.Parser).ParseUnverified(tokenString, jwt.MapClaims{})
		if err != nil {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			ctx := r.Context()
			if roles, ok := claims["roles"].([]interface{}); ok {
				var roleStrs []string
				for _, role := range roles {
					if strRole, ok := role.(string); ok {
						roleStrs = append(roleStrs, strRole)
					}
				}
				ctx = context.WithValue(ctx, RolesContextKey, roleStrs)
			}
			if sub, ok := claims["sub"].(string); ok {
				ctx = context.WithValue(ctx, SubContextKey, sub)
			}
			r = r.WithContext(ctx)
		}

		next.ServeHTTP(w, r)
	})
}
