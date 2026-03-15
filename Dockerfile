# Stage 1: Build the React frontend SPA
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate
RUN pnpm install --frozen-lockfile
COPY . .
COPY .env ./
RUN pnpm run build

# Stage 2: Build the Go monolith server
FROM golang:alpine AS backend-builder
WORKDIR /app
# Install necessary build tools
RUN apk add --no-cache gcc musl-dev

# Copy Go modules
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copy the rest of the backend source
COPY backend/ .
# Build the main server and the migration tool
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o run_migrate ./migrate/main.go

# Stage 3: Final lightweight runtime image
FROM alpine:latest
WORKDIR /app
RUN apk --no-cache add ca-certificates tzdata

# Copy built artifacts from earlier stages
COPY --from=backend-builder /app/main .
COPY --from=backend-builder /app/run_migrate .
COPY --from=backend-builder /app/db ./db
COPY --from=frontend-builder /app/vercel_dist ./vercel_dist

# Put backend components in a standard location
RUN mkdir -p /app/backend
RUN mv main /app/backend/
RUN mv run_migrate /app/backend/
RUN mv db /app/backend/

WORKDIR /app/backend

EXPOSE 8080

# The startup command runs DB migrations first, then boots the main Go router
CMD ["sh", "-c", "SPA_DIST_PATH=/app/vercel_dist ./run_migrate && SPA_DIST_PATH=/app/vercel_dist ./main"]
