package main

import (
		"context"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/your-org/go-invoice/ent"
	"github.com/your-org/go-invoice/handlers"

	_ "github.com/lib/pq"
)

func main() {
	// Connect to the database
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	client, err := ent.Open("postgres", databaseURL)
	if err != nil {
		log.Fatalf("failed opening connection to postgres: %v", err)
	}
	defer client.Close()

	// Run the auto migration tool
	if err := client.Schema.Create(context.Background()); err != nil {
		log.Fatalf("failed creating schema resources: %v", err)
	}

	app := fiber.New()

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New())

	// API routes
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Hello, World!")
	})

	// Client routes
	app.Get("/api/v1/clients", func(c *fiber.Ctx) error {
		return handlers.ListClients(c, client)
	})

	log.Fatal(app.Listen(":3000"))
}
