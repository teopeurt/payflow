import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
import crossSchemaRoutes from './routes/cross-schema'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Payflow Cross-Schema API Server')
})

// Mount cross-schema routes
app.route('/api/cross-schema', crossSchemaRoutes)

export const handler = handle(app)
