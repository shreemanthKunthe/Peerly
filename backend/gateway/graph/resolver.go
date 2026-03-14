package graph

import (
	authpb "peerly.dev/backend/proto/authpb"
	userpb "peerly.dev/backend/proto/userpb"
)

type Resolver struct {
	AuthClient authpb.AuthServiceClient
	UserClient userpb.UserServiceClient
}
