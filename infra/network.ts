// infra/network.ts
// Defines the shared networking resources for the application.

// Create a new VPC for our services to run in.
const vpc = new sst.aws.Vpc("PayflowVpc");

// Create an ECS Cluster to host our containerized tasks and services.
export const cluster = new sst.aws.Cluster("PayflowCluster", { vpc });
