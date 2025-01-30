# DeployNinja — Deployment service for web applications

A robust deployment platform that enables automated deployments directly from GitHub repositories. This platform supports multiple frameworks (React, Vue, Angular) with features like continuous integration, custom subdomains, and comprehensive deployment monitoring.

## Demo


https://github.com/user-attachments/assets/f4484fee-af91-48e9-9272-7fa08c0879e6



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

Each directory contains its own `.env.example` file. Copy the respective `.env.example` to `.env` in each directory and update the values according to your setup.

