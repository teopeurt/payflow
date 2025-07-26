package handlers

import (
	"encoding/json"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/your-org/go-invoice/ent"
	"github.com/your-org/go-invoice/ent/recurringinvoicetemplate"
	"github.com/your-org/go-invoice/services"
)

// CreateRecurringTemplateRequest represents the request body for creating a recurring template
type CreateRecurringTemplateRequest struct {
	TemplateName   string                 `json:"template_name" validate:"required"`
	OrganizationID string                 `json:"organization_id" validate:"required"`
	ProjectID      *string                `json:"project_id,omitempty"`
	ClientID       *string                `json:"client_id,omitempty"`
	InvoiceData    map[string]interface{} `json:"invoice_data" validate:"required"`
	Frequency      string                 `json:"frequency" validate:"required,oneof=daily weekly monthly quarterly yearly"`
	StartDate      time.Time              `json:"start_date" validate:"required"`
	UntilType      string                 `json:"until_type" validate:"required,oneof=indefinitely on_date count"`
	EndDate        *time.Time             `json:"end_date,omitempty"`
	MaxCount       *int                   `json:"max_count,omitempty"`
}

// UpdateRecurringTemplateRequest represents the request body for updating a recurring template
type UpdateRecurringTemplateRequest struct {
	TemplateName *string                `json:"template_name,omitempty"`
	IsActive     *bool                  `json:"is_active,omitempty"`
	InvoiceData  map[string]interface{} `json:"invoice_data,omitempty"`
	Frequency    *string                `json:"frequency,omitempty"`
	StartDate    *time.Time             `json:"start_date,omitempty"`
	UntilType    *string                `json:"until_type,omitempty"`
	EndDate      *time.Time             `json:"end_date,omitempty"`
	MaxCount     *int                   `json:"max_count,omitempty"`
}

// RecurringTemplateResponse represents the response structure for recurring templates
type RecurringTemplateResponse struct {
	ID                   string                 `json:"id"`
	TemplateName         string                 `json:"template_name"`
	OrganizationID       string                 `json:"organization_id"`
	ProjectID            *string                `json:"project_id"`
	ClientID             *string                `json:"client_id"`
	IsActive             bool                   `json:"is_active"`
	InvoiceData          map[string]interface{} `json:"invoice_data"`
	Frequency            string                 `json:"frequency"`
	StartDate            time.Time              `json:"start_date"`
	UntilType            string                 `json:"until_type"`
	EndDate              *time.Time             `json:"end_date"`
	MaxCount             *int                   `json:"max_count"`
	NextGenerationDate   time.Time              `json:"next_generation_date"`
	GenerationCount      int                    `json:"generation_count"`
	LastGeneratedAt      *time.Time             `json:"last_generated_at"`
	CreatedAt            time.Time              `json:"created_at"`
	UpdatedAt            time.Time              `json:"updated_at"`
}

// ListRecurringTemplates handles GET /api/v1/recurring-templates
func ListRecurringTemplates(c *fiber.Ctx, client *ent.Client) error {
	// Get query parameters
	organizationID := c.Query("organization_id")
	activeOnly := c.Query("active") == "true"

	query := client.RecurringInvoiceTemplate.Query()

	// Filter by organization if provided
	if organizationID != "" {
		query = query.Where(recurringinvoicetemplate.OrganizationID(organizationID))
	}

	// Filter by active status if requested
	if activeOnly {
		query = query.Where(recurringinvoicetemplate.IsActive(true))
	}

	templates, err := query.Order(ent.Desc("created_at")).All(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch recurring templates",
		})
	}

	// Convert to response format
	var response []RecurringTemplateResponse
	for _, template := range templates {
		response = append(response, convertTemplateToResponse(template))
	}

	return c.JSON(response)
}

// GetRecurringTemplate handles GET /api/v1/recurring-templates/:id
func GetRecurringTemplate(c *fiber.Ctx, client *ent.Client) error {
	id := c.Params("id")

	template, err := client.RecurringInvoiceTemplate.Get(c.Context(), id)
	if err != nil {
		if ent.IsNotFound(err) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Recurring template not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch recurring template",
		})
	}

	return c.JSON(convertTemplateToResponse(template))
}

// CreateRecurringTemplate handles POST /api/v1/recurring-templates
func CreateRecurringTemplate(c *fiber.Ctx, client *ent.Client) error {
	var req CreateRecurringTemplateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Calculate next generation date
	nextDate := calculateInitialGenerationDate(req.StartDate, req.Frequency)

	// Create the template
	builder := client.RecurringInvoiceTemplate.Create().
		SetTemplateName(req.TemplateName).
		SetOrganizationID(req.OrganizationID).
		SetInvoiceData(req.InvoiceData).
		SetFrequency(req.Frequency).
		SetStartDate(req.StartDate).
		SetUntilType(req.UntilType).
		SetNextGenerationDate(nextDate)

	if req.ProjectID != nil {
		builder = builder.SetProjectID(*req.ProjectID)
	}
	if req.ClientID != nil {
		builder = builder.SetClientID(*req.ClientID)
	}
	if req.EndDate != nil {
		builder = builder.SetEndDate(*req.EndDate)
	}
	if req.MaxCount != nil {
		builder = builder.SetMaxCount(*req.MaxCount)
	}

	template, err := builder.Save(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create recurring template",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(convertTemplateToResponse(template))
}

// UpdateRecurringTemplate handles PUT /api/v1/recurring-templates/:id
func UpdateRecurringTemplate(c *fiber.Ctx, client *ent.Client) error {
	id := c.Params("id")

	var req UpdateRecurringTemplateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Start with update builder
	builder := client.RecurringInvoiceTemplate.UpdateOneID(id)

	// Update fields if provided
	if req.TemplateName != nil {
		builder = builder.SetTemplateName(*req.TemplateName)
	}
	if req.IsActive != nil {
		builder = builder.SetIsActive(*req.IsActive)
	}
	if req.InvoiceData != nil {
		builder = builder.SetInvoiceData(req.InvoiceData)
	}
	if req.Frequency != nil {
		builder = builder.SetFrequency(*req.Frequency)
	}
	if req.StartDate != nil {
		builder = builder.SetStartDate(*req.StartDate)
	}
	if req.UntilType != nil {
		builder = builder.SetUntilType(*req.UntilType)
	}
	if req.EndDate != nil {
		builder = builder.SetEndDate(*req.EndDate)
	}
	if req.MaxCount != nil {
		builder = builder.SetMaxCount(*req.MaxCount)
	}

	template, err := builder.Save(c.Context())
	if err != nil {
		if ent.IsNotFound(err) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Recurring template not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update recurring template",
		})
	}

	return c.JSON(convertTemplateToResponse(template))
}

// DeleteRecurringTemplate handles DELETE /api/v1/recurring-templates/:id
func DeleteRecurringTemplate(c *fiber.Ctx, client *ent.Client) error {
	id := c.Params("id")

	err := client.RecurringInvoiceTemplate.DeleteOneID(id).Exec(c.Context())
	if err != nil {
		if ent.IsNotFound(err) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Recurring template not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete recurring template",
		})
	}

	return c.Status(fiber.StatusNoContent).Send(nil)
}

// GenerateRecurringInvoice handles POST /api/v1/recurring-templates/:id/generate
func GenerateRecurringInvoice(c *fiber.Ctx, client *ent.Client) error {
	id := c.Params("id")

	// Get the template
	template, err := client.RecurringInvoiceTemplate.Get(c.Context(), id)
	if err != nil {
		if ent.IsNotFound(err) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Recurring template not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch recurring template",
		})
	}

	// Check if template is active
	if !template.IsActive {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot generate from inactive template",
		})
	}

	// Create recurring service and process this template
	recurringService := services.NewRecurringInvoiceService(client)
	
	// For manual generation, we temporarily set the next generation date to now
	originalDate := template.NextGenerationDate
	_, err = client.RecurringInvoiceTemplate.UpdateOneID(template.ID).
		SetNextGenerationDate(time.Now().Truncate(24 * time.Hour)).
		Save(c.Context())
	
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to prepare template for generation",
		})
	}

	// Process the template
	err = recurringService.ProcessRecurringInvoices(c.Context())
	if err != nil {
		// Restore original date on failure
		client.RecurringInvoiceTemplate.UpdateOneID(template.ID).
			SetNextGenerationDate(originalDate).
			Exec(c.Context())
		
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate invoice from template",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Invoice generated successfully",
	})
}

// convertTemplateToResponse converts an Ent template to response format
func convertTemplateToResponse(template *ent.RecurringInvoiceTemplate) RecurringTemplateResponse {
	return RecurringTemplateResponse{
		ID:                   template.ID.String(),
		TemplateName:         template.TemplateName,
		OrganizationID:       template.OrganizationID,
		ProjectID:            template.ProjectID,
		ClientID:             template.ClientID,
		IsActive:             template.IsActive,
		InvoiceData:          template.InvoiceData.(map[string]interface{}),
		Frequency:            template.Frequency,
		StartDate:            template.StartDate,
		UntilType:            template.UntilType,
		EndDate:              template.EndDate,
		MaxCount:             template.MaxCount,
		NextGenerationDate:   template.NextGenerationDate,
		GenerationCount:      template.GenerationCount,
		LastGeneratedAt:      template.LastGeneratedAt,
		CreatedAt:            template.CreatedAt,
		UpdatedAt:            template.UpdatedAt,
	}
}

// calculateInitialGenerationDate calculates when the first invoice should be generated
func calculateInitialGenerationDate(startDate time.Time, frequency string) time.Time {
	now := time.Now().Truncate(24 * time.Hour)
	start := startDate.Truncate(24 * time.Hour)
	
	// If start date is in the future, use it
	if start.After(now) {
		return start
	}
	
	// If start date is today or in the past, calculate next occurrence
	switch frequency {
	case "daily":
		return now
	case "weekly":
		// Find next occurrence of the same day of week
		for current := now; ; current = current.AddDate(0, 0, 1) {
			if current.Weekday() == start.Weekday() {
				return current
			}
		}
	case "monthly":
		// Find next occurrence of the same day of month
		next := time.Date(now.Year(), now.Month(), start.Day(), 0, 0, 0, 0, now.Location())
		if next.Before(now) {
			next = next.AddDate(0, 1, 0)
		}
		return next
	case "quarterly":
		// Find next quarter occurrence
		next := time.Date(now.Year(), start.Month(), start.Day(), 0, 0, 0, 0, now.Location())
		for next.Before(now) {
			next = next.AddDate(0, 3, 0)
		}
		return next
	case "yearly":
		// Find next yearly occurrence
		next := time.Date(now.Year(), start.Month(), start.Day(), 0, 0, 0, 0, now.Location())
		if next.Before(now) {
			next = next.AddDate(1, 0, 0)
		}
		return next
	default:
		return now
	}
}