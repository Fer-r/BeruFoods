#!/bin/bash

# Constants
readonly SCRIPT_NAME="Mercure Implementation Test"
readonly LOG_TAIL_LINES=10
readonly ENV_FILE=".env"
readonly ENV_EXAMPLE=".env.example"

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# Success/Error symbols
readonly SUCCESS_SYMBOL="✓"
readonly ERROR_SYMBOL="✗"

# Required environment variables
readonly REQUIRED_ENV_VARS=(
    "MERCURE_JWT_SECRET"
    "MERCURE_URL"
    "MERCURE_PUBLIC_URL"
    "MERCURE_CORS_ALLOWED_ORIGINS"
)

# Docker services to check
readonly DOCKER_SERVICES="mercure|nginx|backend"

# Health check endpoints
readonly MERCURE_HEALTH_PROXY="https://localhost/.well-known/mercure/healthz"
readonly MERCURE_HEALTH_DIRECT="http://localhost/.well-known/mercure/healthz"

print_header() {
    local title="$1"
    echo -e "${YELLOW}$title${NC}"
    echo "=============================="
}

print_section() {
    local section_num="$1"
    local description="$2"
    echo ""
    echo -e "${YELLOW}$section_num. $description...${NC}"
}

print_success() {
    local message="$1"
    echo -e "${GREEN}$SUCCESS_SYMBOL $message${NC}"
}

print_error() {
    local message="$1"
    echo -e "${RED}$ERROR_SYMBOL $message${NC}"
}

print_info() {
    local message="$1"
    echo "   $message"
}

exit_with_error() {
    local message="$1"
    local exit_code="${2:-1}"
    print_error "$message"
    exit "$exit_code"
}

check_env_file_exists() {
    if [ ! -f "$ENV_FILE" ]; then
        exit_with_error "ENV file not found. Please copy $ENV_EXAMPLE to $ENV_FILE and configure it."
    fi
}

load_environment_variables() {
    export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
}

check_required_env_var() {
    local var_name="$1"
    local var_value="${!var_name}"
    
    if [ -z "$var_value" ]; then
        exit_with_error "$var_name is not set in $ENV_FILE"
    else
        print_success "$var_name is configured"
    fi
}

check_all_required_env_vars() {
    for var in "${REQUIRED_ENV_VARS[@]}"; do
        check_required_env_var "$var"
    done
}

display_environment_variables() {
    for var in "${REQUIRED_ENV_VARS[@]}"; do
        print_info "$var: ${!var}"
    done
}

check_docker_services() {
    docker-compose ps | grep -E "$DOCKER_SERVICES"
}

test_health_endpoint() {
    local endpoint="$1"
    local description="$2"
    
    if curl -k "$endpoint" 2>/dev/null >/dev/null; then
        print_success "$description health check passed"
        return 0
    else
        print_error "$description health check failed"
        return 1
    fi
}

display_mercure_logs() {
    echo "Recent Mercure logs:"
    docker-compose logs --tail="$LOG_TAIL_LINES" mercure
}

print_testing_instructions() {
    cat << EOF

7. Instructions to test notifications:
   a) Start all services: docker-compose up -d
   b) Run migrations: docker-compose exec backend php bin/console doctrine:migrations:migrate
   c) Login as a restaurant or user
   d) Create an order (for restaurant notifications) or update order status (for user notifications)
   e) Check the notification bell in the header
EOF
}

print_monitoring_instructions() {
    echo ""
    echo "8. To monitor Mercure logs in real-time:"
    echo "   docker-compose logs -f mercure"
}

print_manual_testing_instructions() {
    cat << EOF

9. To test Mercure subscription manually:
   # First get a JWT token by logging in, then:
   curl -N -H 'Cookie: mercure_authorization=YOUR_JWT_TOKEN' \\
        'https://localhost/.well-known/mercure?topic=/users/1/notifications'
EOF
}

print_troubleshooting_guide() {
    cat << EOF

10. Common troubleshooting:
    - If connection fails, check that all services are running
    - Verify JWT secret matches between backend and Mercure service
    - Check browser console for CORS errors
    - Ensure the JWT token contains proper Mercure claims
EOF
}

run_all_tests() {
    print_header "Testing $SCRIPT_NAME"
    
    # Step 1: Check environment file
    print_section "1" "Checking environment file"
    check_env_file_exists
    load_environment_variables
    
    # Step 2: Check JWT secret
    print_section "2" "Checking Mercure JWT Secret"
    check_required_env_var "MERCURE_JWT_SECRET"
    
    # Step 3: Display environment variables
    print_section "3" "Checking environment variables"
    display_environment_variables
    
    # Step 4: Check Docker services
    print_section "4" "Checking Docker services"
    check_docker_services
    
    # Step 5: Test health endpoints
    print_section "5" "Testing Mercure health endpoint via Nginx proxy"
    test_health_endpoint "$MERCURE_HEALTH_PROXY" "Mercure proxy"
    
    print_section "6" "Testing direct Mercure service (internal)"
    docker-compose exec mercure curl -f "$MERCURE_HEALTH_DIRECT" 2>/dev/null && \
        print_success "Direct Mercure health check passed" || \
        print_error "Direct Mercure health check failed"
    
    # Step 7: Display logs
    print_section "7" "Checking Mercure logs for any errors"
    display_mercure_logs
    
    # Instructions and guides
    print_testing_instructions
    print_monitoring_instructions
    print_manual_testing_instructions
    print_troubleshooting_guide
}

# Main execution
main() {
    run_all_tests
}

# Run the script
main "$@" 