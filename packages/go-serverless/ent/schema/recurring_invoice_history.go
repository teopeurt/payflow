package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/edge"
)

// RecurringInvoiceHistory holds the schema definition for the RecurringInvoiceHistory entity.
type RecurringInvoiceHistory struct {
	ent.Schema
}

// Fields of the RecurringInvoiceHistory.
func (RecurringInvoiceHistory) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", nil).Default(nil),
		field.UUID("template_id", nil),
		field.UUID("invoice_id", nil).Optional(),
		
		// Generation details
		field.Time("generated_at").Default(time.Now),
		field.Time("generation_date"), // The date this invoice was supposed to be generated for
		field.Enum("status").Values("success", "failed", "skipped").Default("success"),
		field.Text("error_message").Optional(),
		
		// Metadata
		field.JSON("invoice_data", map[string]interface{}{}).Optional(), // Snapshot of invoice data at generation time
		field.Time("created_at").Default(time.Now),
	}
}

// Edges of the RecurringInvoiceHistory.
func (RecurringInvoiceHistory) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("template", RecurringInvoiceTemplate.Type).Ref("recurring_history").Unique().Field("template_id"),
	}
}