#!/bin/bash

# Restaurant Recipe App Deployment Script
# Supports multiple deployment targets: docker-dev, docker-prod, aws-ecs, kubernetes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_usage() {
    echo "Usage: $0 <deployment-target> [options]"
    echo ""
    echo "Deployment Targets:"
    echo "  docker-dev     - Local development with Docker Compose"
    echo "  docker-prod    - Production with Docker Compose"
    echo "  aws-ecs        - AWS ECS Fargate deployment"
    echo "  kubernetes     - Kubernetes deployment"
    echo ""
    echo "Options:"
    echo "  --build        - Force rebuild of images"
    echo "  --clean        - Clean up before deployment"
    echo "  --env-file     - Specify custom environment file"
    echo "  --help         - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 docker-dev --build"
    echo "  $0 docker-prod --env-file .env.staging"
    echo "  $0 aws-ecs --clean"
}

# Parse arguments
DEPLOYMENT_TARGET=""
BUILD_FLAG=""
CLEAN_FLAG=""
ENV_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        docker-dev|docker-prod|aws-ecs|kubernetes)
            DEPLOYMENT_TARGET="$1"
            shift
            ;;
        --build)
            BUILD_FLAG="--build"
            shift
            ;;
        --clean)
            CLEAN_FLAG="true"
            shift
            ;;
        --env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

if [[ -z "$DEPLOYMENT_TARGET" ]]; then
    log_error "Deployment target is required"
    show_usage
    exit 1
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log_info "Starting deployment for target: $DEPLOYMENT_TARGET"
log_info "Project root: $PROJECT_ROOT"

# Change to project root
cd "$PROJECT_ROOT"

# Deployment functions
deploy_docker_dev() {
    log_info "Deploying to Docker Development environment"
    
    local compose_file="deployment/docker/development/docker-compose.yml"
    local env_file="${ENV_FILE:-deployment/docker/development/env.development}"
    
    if [[ "$CLEAN_FLAG" == "true" ]]; then
        log_info "Cleaning up existing containers and volumes"
        docker-compose -f "$compose_file" --env-file "$env_file" down -v
    fi
    
    log_info "Starting development environment"
    docker-compose -f "$compose_file" --env-file "$env_file" up $BUILD_FLAG -d
    
    log_success "Development environment started successfully"
    log_info "Frontend: http://localhost:3000"
    log_info "Backend: http://localhost:8080"
}

deploy_docker_prod() {
    log_info "Deploying to Docker Production environment"
    
    local compose_file="deployment/docker/production/docker-compose.yml"
    local env_file="${ENV_FILE:-deployment/docker/production/env.production}"
    
    if [[ ! -f "$env_file" ]]; then
        log_error "Production environment file not found: $env_file"
        log_warning "Please copy and configure the production environment file"
        exit 1
    fi
    
    # Validate required environment variables
    log_info "Validating production configuration"
    if grep -q "CHANGE_THIS" "$env_file"; then
        log_error "Production environment file contains placeholder values"
        log_warning "Please update all CHANGE_THIS values in $env_file"
        exit 1
    fi
    
    if [[ "$CLEAN_FLAG" == "true" ]]; then
        log_info "Cleaning up existing containers and volumes"
        docker-compose -f "$compose_file" --env-file "$env_file" down -v
    fi
    
    log_info "Starting production environment"
    docker-compose -f "$compose_file" --env-file "$env_file" up $BUILD_FLAG -d
    
    log_success "Production environment started successfully"
    log_info "Application available on port 80 (HTTP) and 443 (HTTPS)"
}

deploy_aws_ecs() {
    log_info "Deploying to AWS ECS"
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check if logged in to AWS
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "Not authenticated with AWS"
        log_info "Please run: aws configure"
        exit 1
    fi
    
    log_warning "AWS ECS deployment requires additional setup:"
    log_info "1. ECR repositories for images"
    log_info "2. ECS cluster and service configuration"
    log_info "3. Application Load Balancer setup"
    log_info "4. RDS or DocumentDB database"
    log_info ""
    log_info "Consider using the Terraform configuration in deployment/aws/terraform/"
    
    exit 1
}

deploy_kubernetes() {
    log_info "Deploying to Kubernetes"
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Not connected to a Kubernetes cluster"
        exit 1
    fi
    
    local k8s_dir="deployment/kubernetes/base"
    
    log_info "Applying Kubernetes manifests"
    kubectl apply -f "$k8s_dir/configmap.yaml"
    kubectl apply -f "$k8s_dir/backend-deployment.yaml"
    kubectl apply -f "$k8s_dir/frontend-deployment.yaml"
    kubectl apply -f "$k8s_dir/ingress.yaml"
    
    log_success "Kubernetes deployment completed"
    log_info "Check deployment status with: kubectl get pods"
}

# Execute deployment based on target
case $DEPLOYMENT_TARGET in
    docker-dev)
        deploy_docker_dev
        ;;
    docker-prod)
        deploy_docker_prod
        ;;
    aws-ecs)
        deploy_aws_ecs
        ;;
    kubernetes)
        deploy_kubernetes
        ;;
    *)
        log_error "Unknown deployment target: $DEPLOYMENT_TARGET"
        exit 1
        ;;
esac

log_success "Deployment completed successfully!"
