package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/edge"
)

// InvoiceItem holds the schema definition for the InvoiceItem entity.
type InvoiceItem struct {
	ent.Schema
}

// Fields of the InvoiceItem.
func (InvoiceItem) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", nil).Default(nil),
		field.UUID("invoice_id", nil),
		field.Text("description").NotEmpty(),
		field.Float("quantity").Positive().Default(1),
		field.Float("unit_price").NonNegative(),
		field.Float("amount").NonNegative(),
		field.Float("tax_rate").NonNegative().Default(0),
		field.Float("discount_rate").NonNegative().Default(0),
		field.Time("created_at").Default(time.Now),
		field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
	}
}

// Edges of the InvoiceItem.
func (InvoiceItem) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("invoice", Invoice.Type).Ref("invoice_items").Unique().Field("invoice_id"),
	}
}