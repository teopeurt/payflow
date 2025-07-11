package handlers

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/your-org/go-invoice/ent"
)

// ListClients retrieves all clients from the database and returns them as JSON.
func ListClients(c *fiber.Ctx, client *ent.Client) error {
	clients, err := client.Client.Query().All(context.Background())
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "cannot get clients"})
	}
	return c.JSON(clients)
}
