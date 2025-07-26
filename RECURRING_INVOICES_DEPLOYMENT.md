# Recurring Invoice System Deployment Guide

This guide covers the deployment of the recurring invoice system using SST v3 with AWS infrastructure.

## Architecture Overview

The recurring invoice system consists of:
1. **Database Migration**: Supabase PostgreSQL with recurring invoice tables
2. **Go Service**: Recurring invoice processing service
3. **Scheduled Execution**: AWS EventBridge + ECS/Fargate for daily processing
4. **Manual Triggers**: API endpoints for manual invoice generation

## Deployment Options

### Option 1: AWS ECS/Fargate (Recommended)
Best for production workloads with predictable scheduling needs.

```bash
# Deploy the containerized service
sst deploy --stage production
```

**Features:**
- Scales to zero when not running
- Reliable container execution
- Better resource management for Go applications
- Integrated logging and monitoring

### Option 2: AWS Batch
Better for complex or resource-intensive processing jobs.

```bash
# Deploy with batch processing
sst deploy --stage production --config batch
```

**Features:**
- Queue management
- Retry logic
- Resource scaling based on job requirements
- Cost-effective for sporadic large workloads

### Option 3: AWS Lambda (Development/Testing)
Suitable for development and testing environments.

```bash
# Deploy Lambda function (requires Go layer)
sst deploy --stage dev
```

## Environment Configuration

### Required Environment Variables

Create environment-specific configuration:

```bash
# .env.production
DATABASE_URL=postgresql://user:pass@host:port/dbname
RUN_ONCE=true
NODE_ENV=production

# .env.development  
DATABASE_URL=postgresql://localhost:5432/payflow_dev
RUN_ONCE=true
NODE_ENV=development
```

### SST Environment Configuration

Add to your SST configuration:

```typescript
// sst.config.ts
environment: {
  DATABASE_URL: $app.stage === "production" 
    ? process.env.PROD_DATABASE_URL 
    : process.env.DEV_DATABASE_URL,
  RUN_ONCE: "true",
}
```

## Database Migration

Run the migration before deploying:

```bash
# Apply Supabase migration
cd packages/core/supabase
supabase migration up --local  # For local development
supabase migration up          # For production
```

## Deployment Steps

### 1. Build and Test Go Service Locally

```bash
cd packages/go-serverless
make generate  # Generate Ent code
make build/all # Build all binaries
make test      # Run tests
```

### 2. Deploy Infrastructure

```bash
# Deploy to staging
sst deploy --stage staging

# Deploy to production
sst deploy --stage production
```

### 3. Verify Deployment

```bash
# Check deployed resources
sst resource list --stage production

# View logs
aws logs tail /aws/ecs/recurring-invoice-task --follow
```

## Monitoring and Observability

### CloudWatch Metrics
Monitor the following metrics:
- Task execution duration
- Success/failure rates
- Database connection health
- Invoice generation counts

### Logging
Log aggregation locations:
- ECS Task logs: `/aws/ecs/recurring-invoice-task`
- Lambda logs: `/aws/lambda/RecurringInvoiceProcessor`
- EventBridge rule executions: `/aws/events/rules`

### Alerting
Set up CloudWatch alarms for:
- Failed executions
- Long-running tasks
- Database connection failures
- High error rates

## Manual Execution

### Via Manual Processor API
```bash
curl -X POST https://YOUR_MANUAL_PROCESSOR_URL
```

### Via AWS CLI
```bash
# Trigger ECS task manually
aws ecs run-task \
  --cluster recurring-invoice-cluster \
  --task-definition recurring-invoice-task:1 \
  --launch-type FARGATE

# Trigger Batch job manually  
aws batch submit-job \
  --job-name manual-recurring-invoice \
  --job-queue recurring-invoice-queue \
  --job-definition recurring-invoice-batch
```

### Via Go Binary (Development)
```bash
cd packages/go-serverless
DATABASE_URL="your-db-url" RUN_ONCE=true ./scheduler
```

## Scaling Considerations

### Production Scaling
- **CPU/Memory**: Start with 0.25 vCPU / 512 MB, scale based on invoice volume
- **Timeout**: Set to 30 minutes for large organizations
- **Concurrency**: Limit to 1 concurrent execution to avoid duplicate processing

### Cost Optimization
- Use Fargate Spot instances for non-critical workloads
- Scale to zero between executions
- Consider AWS Savings Plans for predictable workloads

## Security Configuration

### IAM Permissions
Required permissions for the service:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds:Connect",
        "secretsmanager:GetSecretValue",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

### Network Security
- Place ECS tasks in private subnets
- Use VPC endpoints for AWS services
- Configure security groups to allow only necessary traffic

## Troubleshooting

### Common Issues

1. **Database Connection Failures**
   - Check DATABASE_URL format
   - Verify network connectivity
   - Check RDS security groups

2. **Container Launch Failures**
   - Verify Docker image builds successfully
   - Check ECS task definition
   - Review task role permissions

3. **Go Binary Execution Issues**
   - Ensure Ent code generation completed
   - Verify all dependencies are included
   - Check for architecture mismatches (amd64 vs arm64)

### Debug Commands
```bash
# View container logs
docker run --rm -it your-registry/recurring-invoice:latest

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Manual task execution with debugging
DEBUG=true RUN_ONCE=true go run cmd/scheduler/main.go
```

## Maintenance

### Regular Tasks
- Monitor CloudWatch metrics and logs
- Review and update resource limits based on usage
- Update container images with security patches
- Backup and test database recovery procedures

### Quarterly Reviews
- Analyze cost and performance metrics
- Review scaling settings
- Update IAM permissions following least privilege
- Test disaster recovery procedures

## Development Workflow

### Local Development
```bash
# Start local development environment
docker-compose up -d postgres
export DATABASE_URL="postgresql://localhost:5432/payflow_dev"

# Run recurring invoice processing locally
cd packages/go-serverless
make run/scheduler
```

### Testing
```bash
# Run all tests
make test

# Integration tests with database
DATABASE_URL="test-db-url" go test ./services/...

# Load testing
go run cmd/load-test/main.go --templates 100 --duration 5m
```

This deployment guide provides comprehensive coverage of the recurring invoice system deployment using modern AWS infrastructure patterns with SST v3.