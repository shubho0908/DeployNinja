# DeployNinja — Deployment service for web applications

A robust deployment platform that enables automated deployments directly from GitHub repositories. This platform supports multiple frameworks (React, Vue, Angular) with features like continuous integration, custom subdomains, and comprehensive deployment monitoring.

## Features

- GitHub Authentication Integration
- Direct GitHub Repository Deployment
- Continuous Integration with Automatic Redeployment
- Custom Subdomain Configuration
- Multi-Framework Support (React, Vue, Angular)
- Project Management Dashboard
- Detailed Deployment Logs and History
- Real-time Build Log Streaming

## Technology Stack

- **Frontend & API**: Next.js
- **Database**: 
  - PostgreSQL (NeonDB) - Primary database
  - ClickHouse - Build Logs storage
- **State Management**: Redux Toolkit
- **Cloud Services**:
  - AWS S3 - Artifact storage
  - AWS ECR/ECS - Container management
- **Message Broker**: Apache Kafka - Build log pipeline
- **Additional Services**: Node.js reverse proxy for subdomain handling

## Project Structure

The project consists of three main components:

1. **Deployment App** (Next.js)
2. **Build Server**
3. **S3 Reverse Proxy**

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/shubho0908/Deployment-app
cd deployment-app
```

### 2. Build Server Setup

```bash
cd build-server
# Build Docker image
docker build -t build-server .
# Push to AWS ECR
aws ecr get-login-password --region [region] | docker login --username AWS --password-stdin [aws-account-id].dkr.ecr.[region].amazonaws.com
docker tag build-server:latest [aws-account-id].dkr.ecr.[region].amazonaws.com/build-server:latest
docker push [aws-account-id].dkr.ecr.[region].amazonaws.com/build-server:latest
```

### 3. Deployment App Setup

```bash
cd ../deployment-app
npm install
# For development
npm run dev
# For production
npm run build
npm start
```

### 4. S3 Reverse Proxy Setup

```bash
cd ../s3-reverse-proxy
npm install
node server.js
```

### 5. Port Forwarding Setup

Set up port forwarding using either:
- VSCode's Port Tunneling
- ngrok

Update the `WEBHOOK_BASE_URL` in your environment variables with the forwarding URL.

## Environment Variables

Create separate `.env` files for each component. Required environment variables for each component:

### Deployment App (.env)
```plaintext
NEXT_PUBLIC_URL=
DATABASE_URL=
AUTH_SECRET=
AUTH_TRUST_HOST=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET_NAME=
AWS_ECR_IMAGE=
AWS_ECR_IMAGE_URI=
CLUSTER=
TASK=
SUBNETS=
SECURITY_GROUPS=
WEBHOOK_SECRET=
WEBHOOK_BASE_URL=
KAFKA_BROKER=
KAFKA_CLIENT_ID=
SASL_USERNAME=
SASL_PASSWORD=
SASL_MECHANISM=
CLICKHOUSE_HOST=
CLICKHOUSE_DB=
CLICKHOUSE_USER=
CLICKHOUSE_PASSWORD=
```

### Build Server (.env)
```plaintext
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET_NAME=
KAFKA_BROKER=
KAFKA_CLIENT_ID=
SASL_USERNAME=
SASL_PASSWORD=
SASL_MECHANISM=
CLICKHOUSE_HOST=
CLICKHOUSE_DB=
CLICKHOUSE_USER=
CLICKHOUSE_PASSWORD=
```

### S3 Reverse Proxy (.env)
```plaintext
BASE_PATH=
CLICKHOUSE_HOST=
CLICKHOUSE_DB=
CLICKHOUSE_USER=
CLICKHOUSE_PASSWORD=
```
