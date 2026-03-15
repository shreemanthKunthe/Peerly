package middleware

import (
	"context"
	"log"
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

		tokenString := ""
		if len(authHeader) > 7 && strings.EqualFold(authHeader[:7], "Bearer ") {
			tokenString = strings.TrimSpace(authHeader[7:])
		}

		if tokenString == "" {
			next.ServeHTTP(w, r)
			return
		}

		claims := jwt.MapClaims{}
		_, _, err := new(jwt.Parser).ParseUnverified(tokenString, &claims)
		if err != nil {
			log.Printf("[JWT] Error parsing token: %v", err)
			next.ServeHTTP(w, r)
			return
		}

		ctx := r.Context()
		if sub, ok := claims["sub"].(string); ok {
			ctx = context.WithValue(ctx, SubContextKey, sub)
		} else if uid, ok := claims["user_id"].(string); ok {
			ctx = context.WithValue(ctx, SubContextKey, uid)
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

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
