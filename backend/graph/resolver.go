package graph

import (
	"peerly.dev/backend/auth"
	"peerly.dev/backend/user"
)

// Resolver is the root GraphQL resolver. It holds direct references to the
// auth and user services (no gRPC — this is a monolith).
type Resolver struct {
	AuthService *auth.Service
	UserService *user.Service
}
