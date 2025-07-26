package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
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

	// Check if this is a one-time run or continuous
	runOnce := os.Getenv("RUN_ONCE") == "true"
	
	if runOnce {
		// Run once and exit (useful for scheduled Cloud Run jobs)
		runRecurringInvoiceJob(recurringService)
		return
	}

	// Run continuously with daily schedule
	runContinuousScheduler(recurringService)
}

func runRecurringInvoiceJob(service *services.RecurringInvoiceService) {
	ctx := context.Background()
	
	log.Println("Starting recurring invoice processing (one-time run)...")
	
	start := time.Now()
	if err := service.ProcessRecurringInvoices(ctx); err != nil {
		log.Fatalf("Failed to process recurring invoices: %v", err)
	}
	
	duration := time.Since(start)
	log.Printf("Recurring invoice processing completed successfully in %v", duration)
}

func runContinuousScheduler(service *services.RecurringInvoiceService) {
	log.Println("Starting continuous recurring invoice scheduler...")
	
	// Create a ticker that runs daily at midnight
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	// Set up graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Run immediately on startup
	go func() {
		runRecurringInvoiceJob(service)
	}()

	for {
		select {
		case <-ticker.C:
			log.Println("Running scheduled recurring invoice processing...")
			if err := service.ProcessRecurringInvoices(ctx); err != nil {
				log.Printf("Error in scheduled processing: %v", err)
				// Continue running even if there's an error
			}

		case sig := <-sigChan:
			log.Printf("Received signal %s, shutting down gracefully...", sig)
			cancel()
			return
		}
	}
}