package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/your-org/go-invoice/ent"
	"github.com/your-org/go-invoice/ent/recurringinvoicetemplate"
	"github.com/your-org/go-invoice/ent/recurringinvoicehistory"
	"github.com/your-org/go-invoice/ent/invoice"
	"github.com/your-org/go-invoice/ent/invoiceitem"
)

// RecurringInvoiceService handles recurring invoice generation
type RecurringInvoiceService struct {
	client *ent.Client
}

// NewRecurringInvoiceService creates a new RecurringInvoiceService
func NewRecurringInvoiceService(client *ent.Client) *RecurringInvoiceService {
	return &RecurringInvoiceService{
		client: client,
	}
}

// InvoiceData represents the structure of invoice data in templates
type InvoiceData struct {
	OrganizationID string                 `json:"organization_id"`
	ProjectID      *string                `json:"project_id"`
	ClientID       *string                `json:"client_id"`
	Amount         float64                `json:"amount"`
	Subtotal       float64                `json:"subtotal"`
	Tax            float64                `json:"tax"`
	Discount       float64                `json:"discount"`
	Notes          *string                `json:"notes"`
	Terms          *string                `json:"terms"`
	PurchaseOrder  *string                `json:"purchase_order"`
	QuoteID        *string                `json:"quote_id"`
	Items          []InvoiceItemData      `json:"items"`
}

// InvoiceItemData represents invoice item data in templates
type InvoiceItemData struct {
	Description  string  `json:"description"`
	Quantity     float64 `json:"quantity"`
	UnitPrice    float64 `json:"unit_price"`
	Amount       float64 `json:"amount"`
	TaxRate      float64 `json:"tax_rate"`
	DiscountRate float64 `json:"discount_rate"`
}

// ProcessRecurringInvoices finds and processes all recurring invoice templates that are due
func (s *RecurringInvoiceService) ProcessRecurringInvoices(ctx context.Context) error {
	today := time.Now().Truncate(24 * time.Hour)
	
	// Find all active templates that are due for generation
	templates, err := s.client.RecurringInvoiceTemplate.Query().
		Where(
			recurringinvoicetemplate.IsActive(true),
			recurringinvoicetemplate.NextGenerationDateLTE(today),
		).
		All(ctx)
	
	if err != nil {
		return fmt.Errorf("failed to fetch recurring templates: %w", err)
	}

	log.Printf("Found %d recurring invoice templates to process", len(templates))

	// Process each template
	for _, template := range templates {
		if err := s.processTemplate(ctx, template); err != nil {
			log.Printf("Error processing template %s: %v", template.ID, err)
			
			// Record the failure
			s.recordGenerationHistory(ctx, template, nil, "failed", err.Error())
			continue
		}
	}

	return nil
}

// processTemplate processes a single recurring invoice template
func (s *RecurringInvoiceService) processTemplate(ctx context.Context, template *ent.RecurringInvoiceTemplate) error {
	// Check if template should still be active based on end conditions
	if !s.shouldGenerateInvoice(template) {
		log.Printf("Template %s has reached its end condition, deactivating", template.ID)
		
		// Deactivate the template
		err := s.client.RecurringInvoiceTemplate.UpdateOneID(template.ID).
			SetIsActive(false).
			Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to deactivate template: %w", err)
		}
		
		s.recordGenerationHistory(ctx, template, nil, "skipped", "Template reached end condition")
		return nil
	}

	// Parse invoice data from template
	var invoiceData InvoiceData
	if err := json.Unmarshal(template.InvoiceData.([]byte), &invoiceData); err != nil {
		return fmt.Errorf("failed to parse invoice data: %w", err)
	}

	// Generate new invoice number
	invoiceNumber, err := s.generateInvoiceNumber(ctx, invoiceData.OrganizationID)
	if err != nil {
		return fmt.Errorf("failed to generate invoice number: %w", err)
	}

	// Create the invoice
	invoice, err := s.createInvoiceFromTemplate(ctx, template, &invoiceData, invoiceNumber)
	if err != nil {
		return fmt.Errorf("failed to create invoice: %w", err)
	}

	// Update template for next generation
	nextDate := s.calculateNextGenerationDate(template.NextGenerationDate, template.Frequency)
	_, err = s.client.RecurringInvoiceTemplate.UpdateOneID(template.ID).
		SetNextGenerationDate(nextDate).
		SetGenerationCount(template.GenerationCount + 1).
		SetLastGeneratedAt(time.Now()).
		Save(ctx)
	
	if err != nil {
		log.Printf("Warning: Failed to update template %s after successful generation: %v", template.ID, err)
	}

	// Record successful generation
	s.recordGenerationHistory(ctx, template, &invoice.ID, "success", "")

	log.Printf("Successfully generated invoice %s from template %s", invoice.InvoiceNumber, template.ID)
	return nil
}

// shouldGenerateInvoice checks if a template should still generate invoices based on end conditions
func (s *RecurringInvoiceService) shouldGenerateInvoice(template *ent.RecurringInvoiceTemplate) bool {
	switch template.UntilType {
	case "indefinitely":
		return true
	case "on_date":
		if template.EndDate == nil {
			return false // Invalid configuration
		}
		return time.Now().Before(*template.EndDate)
	case "count":
		if template.MaxCount == nil {
			return false // Invalid configuration
		}
		return template.GenerationCount < *template.MaxCount
	default:
		return false
	}
}

// generateInvoiceNumber generates a sequential invoice number for an organization
func (s *RecurringInvoiceService) generateInvoiceNumber(ctx context.Context, organizationID string) (string, error) {
	// Find the most recent invoice for this organization
	lastInvoice, err := s.client.Invoice.Query().
		Where(invoice.OrganizationID(organizationID)).
		Order(ent.Desc("created_at")).
		First(ctx)
	
	if err != nil && !ent.IsNotFound(err) {
		return "", fmt.Errorf("failed to query last invoice: %w", err)
	}

	now := time.Now()
	yearMonth := fmt.Sprintf("%d%02d", now.Year(), now.Month())
	
	if ent.IsNotFound(err) || lastInvoice == nil {
		// First invoice for this organization
		return fmt.Sprintf("INV-%s-001", yearMonth), nil
	}

	// Extract number from last invoice and increment
	var lastNumber int
	if n, err := fmt.Sscanf(lastInvoice.InvoiceNumber, "INV-%s-%d", &yearMonth, &lastNumber); n != 2 || err != nil {
		// Fallback if format doesn't match
		return fmt.Sprintf("INV-%s-001", yearMonth), nil
	}

	nextNumber := lastNumber + 1
	return fmt.Sprintf("INV-%s-%03d", yearMonth, nextNumber), nil
}

// createInvoiceFromTemplate creates a new invoice based on a recurring template
func (s *RecurringInvoiceService) createInvoiceFromTemplate(
	ctx context.Context,
	template *ent.RecurringInvoiceTemplate,
	invoiceData *InvoiceData,
	invoiceNumber string,
) (*ent.Invoice, error) {
	now := time.Now()
	dueDate := now.AddDate(0, 0, 30) // Default 30 days payment terms

	// Start transaction
	tx, err := s.client.Tx(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Create invoice
	invoiceBuilder := tx.Invoice.Create().
		SetInvoiceNumber(invoiceNumber).
		SetOrganizationID(invoiceData.OrganizationID).
		SetAmount(invoiceData.Amount).
		SetSubtotal(invoiceData.Subtotal).
		SetTax(invoiceData.Tax).
		SetDiscount(invoiceData.Discount).
		SetIssueDate(now).
		SetDueDate(dueDate).
		SetStatus("draft").
		SetRecurringTemplateID(&template.ID)

	// Set optional fields
	if invoiceData.ProjectID != nil {
		invoiceBuilder = invoiceBuilder.SetProjectID(*invoiceData.ProjectID)
	}
	if invoiceData.ClientID != nil {
		invoiceBuilder = invoiceBuilder.SetClientID(*invoiceData.ClientID)
	}
	if invoiceData.QuoteID != nil {
		invoiceBuilder = invoiceBuilder.SetQuoteID(*invoiceData.QuoteID)
	}
	if invoiceData.Notes != nil {
		invoiceBuilder = invoiceBuilder.SetNotes(*invoiceData.Notes)
	}
	if invoiceData.Terms != nil {
		invoiceBuilder = invoiceBuilder.SetTerms(*invoiceData.Terms)
	}
	if invoiceData.PurchaseOrder != nil {
		invoiceBuilder = invoiceBuilder.SetPurchaseOrder(*invoiceData.PurchaseOrder)
	}

	newInvoice, err := invoiceBuilder.Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create invoice: %w", err)
	}

	// Create invoice items
	for _, itemData := range invoiceData.Items {
		_, err := tx.InvoiceItem.Create().
			SetInvoiceID(newInvoice.ID).
			SetDescription(itemData.Description).
			SetQuantity(itemData.Quantity).
			SetUnitPrice(itemData.UnitPrice).
			SetAmount(itemData.Amount).
			SetTaxRate(itemData.TaxRate).
			SetDiscountRate(itemData.DiscountRate).
			Save(ctx)
		
		if err != nil {
			return nil, fmt.Errorf("failed to create invoice item: %w", err)
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return newInvoice, nil
}

// calculateNextGenerationDate calculates the next generation date based on frequency
func (s *RecurringInvoiceService) calculateNextGenerationDate(currentDate time.Time, frequency string) time.Time {
	switch frequency {
	case "daily":
		return currentDate.AddDate(0, 0, 1)
	case "weekly":
		return currentDate.AddDate(0, 0, 7)
	case "monthly":
		return currentDate.AddDate(0, 1, 0)
	case "quarterly":
		return currentDate.AddDate(0, 3, 0)
	case "yearly":
		return currentDate.AddDate(1, 0, 0)
	default:
		// Default to monthly if unknown frequency
		return currentDate.AddDate(0, 1, 0)
	}
}

// recordGenerationHistory records the generation attempt in history
func (s *RecurringInvoiceService) recordGenerationHistory(
	ctx context.Context,
	template *ent.RecurringInvoiceTemplate,
	invoiceID *int,
	status string,
	errorMessage string,
) {
	builder := s.client.RecurringInvoiceHistory.Create().
		SetTemplateID(template.ID).
		SetGenerationDate(template.NextGenerationDate).
		SetStatus(status)

	if invoiceID != nil {
		builder = builder.SetInvoiceID(*invoiceID)
	}

	if errorMessage != "" {
		builder = builder.SetErrorMessage(errorMessage)
	}

	// Add invoice data snapshot
	if template.InvoiceData != nil {
		builder = builder.SetInvoiceData(template.InvoiceData)
	}

	if _, err := builder.Save(ctx); err != nil {
		log.Printf("Warning: Failed to record generation history: %v", err)
	}
}