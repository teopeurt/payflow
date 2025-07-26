package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/edge"
)

// Invoice holds the schema definition for the Invoice entity.
type Invoice struct {
	ent.Schema
}

// Fields of the Invoice.
func (Invoice) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", nil).Default(nil),
		field.String("invoice_number").NotEmpty(),
		field.UUID("organization_id", nil),
		field.UUID("project_id", nil).Optional(),
		field.UUID("client_id", nil).Optional(),
		field.UUID("quote_id", nil).Optional(),
		field.String("purchase_order").Optional(),
		field.Float("amount").NonNegative(),
		field.Float("subtotal").NonNegative().Default(0),
		field.Float("tax").NonNegative().Default(0),
		field.Float("discount").NonNegative().Default(0),
		field.Time("issue_date"),
		field.Time("due_date"),
		field.Enum("status").Values("draft", "sent", "paid", "overdue", "cancelled", "partially-paid").Default("draft"),
		field.Text("notes").Optional(),
		field.Text("terms").Optional(),
		field.String("logo_url").Optional(),
		
		// Recurring fields
		field.Bool("is_recurring").Default(false),
		field.Enum("recurring_frequency").Values("daily", "weekly", "monthly", "quarterly", "yearly").Optional(),
		field.Time("recurring_start_date").Optional(),
		field.Enum("recurring_until").Values("indefinitely", "on_date", "count").Optional(),
		field.Time("recurring_end_date").Optional(),
		field.Int("recurring_count").Optional(),
		field.UUID("duplicated_from_id", nil).Optional(),
		field.UUID("recurring_template_id", nil).Optional(),
		
		// Timestamps
		field.Time("created_at").Default(time.Now),
		field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
	}
}

// Edges of the Invoice.
func (Invoice) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("invoice_items", InvoiceItem.Type),
		edge.To("payments", Payment.Type),
	}
}