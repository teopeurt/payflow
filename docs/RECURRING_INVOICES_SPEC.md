# Recurring Invoice Technical Specification

## Database Schema

### 1. recurring_invoice_templates

```sql
CREATE TABLE recurring_invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations,
  project_id UUID REFERENCES projects,
  template_name VARCHAR(255) NOT NULL,
  frequency VARCHAR(50) NOT NULL, -- 'weekly', 'monthly', 'quarterly', 'yearly'
  start_date DATE NOT NULL,
  end_type VARCHAR(20) NOT NULL, -- 'indefinitely', 'on_date', 'count'
  end_date DATE,
  occurrence_count INTEGER,
  remaining_count INTEGER,
  next_generation_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  -- Invoice template data
  invoice_data JSONB NOT NULL, -- Stores invoice items, amounts, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recurring_templates_org ON recurring_invoice_templates(organization_id);
CREATE INDEX idx_recurring_templates_next_date ON recurring_invoice_templates(next_generation_date);
```

### 2. recurring_invoice_history

```sql
CREATE TABLE recurring_invoice_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES recurring_invoice_templates,
  invoice_id UUID NOT NULL REFERENCES invoices,
  generation_number INTEGER NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recurring_history_template ON recurring_invoice_history(template_id);
```

### 3. Update to invoices table

```sql
ALTER TABLE invoices
ADD COLUMN is_recurring BOOLEAN DEFAULT false,
ADD COLUMN recurring_template_id UUID REFERENCES recurring_invoice_templates;
```

## API Endpoints

### Go Service Endpoints

#### 1. Template Management

- `POST /api/recurring-templates` - Create new template
- `GET /api/recurring-templates` - List templates
- `GET /api/recurring-templates/:id` - Get template details
- `PUT /api/recurring-templates/:id` - Update template
- `DELETE /api/recurring-templates/:id` - Delete template
- `PUT /api/recurring-templates/:id/status` - Activate/deactivate template

#### 2. Invoice Generation

- `POST /api/recurring-templates/:id/generate` - Manually generate invoice
- `POST /api/recurring-templates/process-due` - Process all due templates (cron job)

### Request/Response Formats

#### Create Template Request
```json
{
  "organization_id": "uuid",
  "project_id": "uuid",
  "template_name": "Monthly Hosting Invoice",
  "frequency": "monthly",
  "start_date": "2025-08-01",
  "end_type": "count",
  "end_date": null,
  "occurrence_count": 12,
  "invoice_data": {
    "items": [
      {
        "description": "Web Hosting",
        "quantity": 1,
        "unit_price": 29.99,
        "amount": 29.99
      }
    ],
    "notes": "Thank you for your business",
    "terms": "Net 30",
    "tax": 0,
    "discount": 0
  }
}
```

## Frontend Components

### 1. InvoiceRecurringSection Component

```tsx
// Enhanced component with frequency options and end conditions
<InvoiceRecurringSection
  form={form}
  isRecurring={form.watch("isRecurring")}
  frequencies={[
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" }
  ]}
/>
```

### 2. RecurringInvoiceList Component

```tsx
// Dashboard component for viewing and managing templates
<RecurringInvoiceList
  templates={templates}
  onEdit={(id) => navigate(`/recurring-invoices/${id}/edit`)}
  onToggleStatus={(id, status) => updateTemplateStatus(id, status)}
  onGenerateNow={(id) => generateInvoiceNow(id)}
/>
```

### 3. RecurringInvoiceForm Component

```tsx
// Form for creating/editing templates
<RecurringInvoiceForm
  defaultValues={template}
  onSubmit={handleSubmit}
  clients={clients}
  projects={projects}
/>
```

## Deployment Configuration

### SST Configuration

```typescript
// sst.config.ts
export default {
  config() {
    return {
      name: "payflow",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(function Site(ctx) {
      // Existing stacks...
      
      // Recurring Invoice Service
      const recurringService = new sst.aws.Function("RecurringInvoiceService", {
        handler: "packages/go-serverless/cmd/recurring-invoices",
        runtime: "go1.x",
        timeout: "5 minutes",
        environment: {
          DATABASE_URL: process.env.DATABASE_URL,
          SUPABASE_URL: process.env.SUPABASE_URL,
          SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
        }
      });

      // Cloud Scheduler (Cron Job)
      new sst.aws.Cron("RecurringInvoiceCron", {
        schedule: "cron(0 9 * * ? *)", // Daily at 9 AM UTC
        job: {
          function: recurringService,
          payload: JSON.stringify({ action: "generate_recurring_invoices" })
        }
      });
    });
  },
};
```

### Cloud Run Configuration

```yaml
# cloud-run.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: recurring-invoice-service
spec:
  template:
    spec:
      containers:
      - image: gcr.io/your-project/recurring-invoice-service:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: supabase-url
        - name: SUPABASE_ANON_KEY
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: supabase-anon-key
        resources:
          limits:
            cpu: "1"
            memory: "512Mi"
```

## Business Logic

### Frequency Calculation

```go
func calculateNextGenerationDate(frequency string, currentDate time.Time) time.Time {
    switch frequency {
    case "weekly":
        return currentDate.AddDate(0, 0, 7)
    case "monthly":
        return currentDate.AddDate(0, 1, 0)
    case "quarterly":
        return currentDate.AddDate(0, 3, 0)
    case "yearly":
        return currentDate.AddDate(1, 0, 0)
    default:
        return currentDate.AddDate(0, 1, 0) // Default to monthly
    }
}
```

### End Condition Handling

```go
func shouldGenerateInvoice(template *models.RecurringTemplate) bool {
    // Check if template is active
    if !template.IsActive {
        return false
    }
    
    // Check if next generation date is due
    if template.NextGenerationDate.After(time.Now()) {
        return false
    }
    
    // Check end conditions
    switch template.EndType {
    case "indefinitely":
        return true
    case "on_date":
        return template.EndDate.After(time.Now())
    case "count":
        return template.RemainingCount > 0
    default:
        return false
    }
}
```