package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/your-org/go-invoice/ent"
	"github.com/your-org/go-invoice/services"

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

	// Create recurring invoice service
	recurringService := services.NewRecurringInvoiceService(client)

	ctx := context.Background()

	log.Println("Starting recurring invoice processing...")
	
	// Process recurring invoices
	if err := recurringService.ProcessRecurringInvoices(ctx); err != nil {
		log.Fatalf("Failed to process recurring invoices: %v", err)
	}

	log.Println("Recurring invoice processing completed successfully")
}