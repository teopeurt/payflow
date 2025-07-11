package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/field"
)

// Client holds the schema definition for the Client entity.
type Client struct {
	ent.Schema
}

// Fields of the Client.
func (Client) Fields() []ent.Field {
	return []ent.Field{
		field.String("name").NotEmpty(),
		field.String("email").NotEmpty().Unique(),
		field.String("phone").Optional(),
	}
}

// Edges of the Client.
func (Client) Edges() []ent.Edge {
	return nil
}
