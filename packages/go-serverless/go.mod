module github.com/your-org/go-invoice

go 1.21

require (
	entgo.io/ent v0.12.5
	github.com/gofiber/fiber/v2 v2.52.0
	github.com/golang-jwt/jwt/v5 v5.2.0
	github.com/lib/pq v1.10.9
	golang.org/x/crypto v0.18.0
)

replace github.com/your-org/go-invoice/ent => ./ent

