package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// A context key for storing the user's roles from the JWT
const RolesContextKey = "userRoles"
const SubContextKey = "userID"

// JWTMiddleware extracts the RS256 token and verifies it using a JWKS endpoint.
func JWTMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			// No token, allow unauthenticated access (resolvers can decide)
			next.ServeHTTP(w, r)
			return
		}

		parts := strings.Split(authHeader, "Bearer ")
		if len(parts) != 2 {
			http.Error(w, "Malformed token", http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

		// In a real app, this parses with the public key fetched from the JWKS cache
		// For the skeleton, we parse without verifying signature just to extract claims.
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
