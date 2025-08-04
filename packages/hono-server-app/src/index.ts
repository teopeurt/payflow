import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
import crossSchemaRoutes from './routes/cross-schema'
import debugRoutes from './routes/debug'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Payflow Cross-Schema API Server')
})

// Mount routes
app.route('/api/cross-schema', crossSchemaRoutes)
app.route('/api/debug', debugRoutes)

export const handler = handle(app)
