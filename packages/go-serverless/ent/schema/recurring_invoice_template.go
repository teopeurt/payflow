package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/edge"
)

// RecurringInvoiceTemplate holds the schema definition for the RecurringInvoiceTemplate entity.
type RecurringInvoiceTemplate struct {
	ent.Schema
}

// Fields of the RecurringInvoiceTemplate.
func (RecurringInvoiceTemplate) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", nil).Default(nil),
		field.UUID("organization_id", nil),
		field.UUID("project_id", nil).Optional(),
		field.UUID("client_id", nil).Optional(),
		field.UUID("created_by", nil).Optional(),
		
		// Template metadata
		field.String("template_name").NotEmpty(),
		field.Bool("is_active").Default(true),
		
		// Invoice template data (JSON)
		field.JSON("invoice_data", map[string]interface{}{}),
		
		// Recurring configuration
		field.Enum("frequency").Values("daily", "weekly", "monthly", "quarterly", "yearly"),
		field.Time("start_date"),
		field.Enum("until_type").Values("indefinitely", "on_date", "count").Default("indefinitely"),
		field.Time("end_date").Optional(),
		field.Int("max_count").Optional(),
		
		// Generation tracking
		field.Time("next_generation_date"),
		field.Int("generation_count").Default(0),
		field.Time("last_generated_at").Optional(),
		
		// Timestamps
		field.Time("created_at").Default(time.Now),
		field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
	}
}

// Edges of the RecurringInvoiceTemplate.
func (RecurringInvoiceTemplate) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("recurring_history", RecurringInvoiceHistory.Type),
	}
}