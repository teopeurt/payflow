package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/edge"
)

// Payment holds the schema definition for the Payment entity.
type Payment struct {
	ent.Schema
}

// Fields of the Payment.
func (Payment) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", nil).Default(nil),
		field.UUID("invoice_id", nil),
		field.Float("amount").Positive(),
		field.Time("payment_date"),
		field.String("method").NotEmpty(),
		field.String("reference").Optional(),
		field.Text("notes").Optional(),
		field.Time("created_at").Default(time.Now),
		field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
	}
}

// Edges of the Payment.
func (Payment) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("invoice", Invoice.Type).Ref("payments").Unique().Field("invoice_id"),
	}
}