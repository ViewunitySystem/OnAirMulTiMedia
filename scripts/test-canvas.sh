#!/bin/bash

# HFRF Universal SDR Canvas Integration Test Script
# Tests all Canvas integration endpoints and functionality

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        🧪 HFRF Universal SDR Canvas Test Script 🧪          ║"
echo "╠══════════════════════════════════════════════════════════════╣"

BASE_URL="http://localhost:8080"
TEST_RESULTS=()

# Function to test an endpoint
test_endpoint() {
    local endpoint="$1"
    local method="${2:-GET}"
    local expected_status="${3:-200}"
    local description="$4"
    
    echo "🔍 Testing: $description"
    echo "   Endpoint: $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json -X "$method" "$BASE_URL$endpoint")
    fi
    
    if [ "$response" = "$expected_status" ]; then
        echo "   ✅ Status: $response (Expected: $expected_status)"
        TEST_RESULTS+=("✅ $description")
    else
        echo "   ❌ Status: $response (Expected: $expected_status)"
        TEST_RESULTS+=("❌ $description")
    fi
    
    echo ""
}

# Function to test POST endpoint with JSON
test_post_endpoint() {
    local endpoint="$1"
    local json_data="$2"
    local expected_status="${3:-200}"
    local description="$4"
    
    echo "🔍 Testing: $description"
    echo "   Endpoint: POST $endpoint"
    echo "   Data: $json_data"
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response.json \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$json_data" \
        "$BASE_URL$endpoint")
    
    if [ "$response" = "$expected_status" ]; then
        echo "   ✅ Status: $response (Expected: $expected_status)"
        TEST_RESULTS+=("✅ $description")
    else
        echo "   ❌ Status: $response (Expected: $expected_status)"
        TEST_RESULTS+=("❌ $description")
    fi
    
    echo ""
}

# Check if server is running
echo "🔍 Checking if HFRF-SDR server is running..."
if curl -s "$BASE_URL" > /dev/null; then
    echo "✅ Server is running on $BASE_URL"
else
    echo "❌ Server is not running on $BASE_URL"
    echo "   Please start the server first with:"
    echo "   ./scripts/build-canvas.sh"
    exit 1
fi

echo ""
echo "🧪 Starting Canvas Integration Tests..."
echo ""

# Test basic endpoints
test_endpoint "/" "GET" "200" "Main Dashboard"
test_endpoint "/canvas-integration" "GET" "200" "Canvas Integration Page"
test_endpoint "/canvas-app" "GET" "200" "Canvas App TypeScript"

# Test API endpoints
test_endpoint "/api/hardware/status" "GET" "200" "Hardware Status API"
test_endpoint "/api/spectrum" "GET" "200" "Spectrum Data API"
test_endpoint "/api/presets" "GET" "200" "Presets API"
test_endpoint "/api/community/stats" "GET" "200" "Community Stats API"
test_endpoint "/api/community/report" "GET" "200" "Community Report API"
test_endpoint "/api/community/details" "GET" "200" "Community Details API"

# Test POST endpoints
test_post_endpoint "/api/royalty" '{"event_type":"TEST_EVENT","asset_id":"test","timestamp":1234567890,"session_id":"test_session","frequency":144300000,"position":0,"data":{}}' "200" "Royalty API"
test_post_endpoint "/api/transmit" '{"preset":"test_preset","frequency":144300000}' "200" "Transmit API"
test_post_endpoint "/api/frequency" '{"frequency":144300000}' "200" "Frequency API"
test_post_endpoint "/api/community/scan" '{}' "200" "Community Scan API"
test_post_endpoint "/api/audit" '{"event_type":"TEST","timestamp":"2025-01-18T12:00:00Z","data":{}}' "200" "Audit API"

# Test proxy endpoint
echo "🔍 Testing: Proxy API"
echo "   Endpoint: GET /api/proxy"
echo "   Testing with httpbin.org/json"

response=$(curl -s -w "%{http_code}" -o /tmp/response.json \
    "$BASE_URL/api/proxy?url=$(echo 'https://httpbin.org/json' | sed 's/:/%3A/g')")

if [ "$response" = "200" ]; then
    echo "   ✅ Status: $response"
    TEST_RESULTS+=("✅ Proxy API")
else
    echo "   ❌ Status: $response"
    TEST_RESULTS+=("❌ Proxy API")
fi

echo ""

# Test Canvas-specific functionality
echo "🎨 Testing Canvas-specific functionality..."

# Test if Canvas integration page loads correctly
if curl -s "$BASE_URL/canvas-integration" | grep -q "Canvas Integration"; then
    echo "✅ Canvas Integration page content loaded"
    TEST_RESULTS+=("✅ Canvas Integration Content")
else
    echo "❌ Canvas Integration page content not found"
    TEST_RESULTS+=("❌ Canvas Integration Content")
fi

# Test if Canvas app TypeScript is accessible
if curl -s "$BASE_URL/canvas-app" | grep -q "HFRF Universal SDR Canvas Integration"; then
    echo "✅ Canvas App TypeScript loaded"
    TEST_RESULTS+=("✅ Canvas App TypeScript")
else
    echo "❌ Canvas App TypeScript not found"
    TEST_RESULTS+=("❌ Canvas App TypeScript")
fi

echo ""

# Test error handling
echo "🔍 Testing error handling..."

# Test invalid endpoint
test_endpoint "/api/invalid" "GET" "404" "Invalid Endpoint (404)"

# Test invalid POST data
test_post_endpoint "/api/frequency" '{"invalid":"data"}' "400" "Invalid POST Data (400)"

echo ""

# Summary
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    📊 TEST SUMMARY 📊                      ║"
echo "╠══════════════════════════════════════════════════════════════╣"

passed=0
failed=0

for result in "${TEST_RESULTS[@]}"; do
    echo "║ $result"
    if [[ $result == ✅* ]]; then
        ((passed++))
    else
        ((failed++))
    fi
done

echo "╠══════════════════════════════════════════════════════════════╣"
echo "║ Tests Passed: $passed                                           ║"
echo "║ Tests Failed: $failed                                           ║"
echo "║ Total Tests:  $((passed + failed))                                           ║"

if [ $failed -eq 0 ]; then
    echo "║ Status: ✅ ALL TESTS PASSED                                ║"
else
    echo "║ Status: ❌ SOME TESTS FAILED                               ║"
fi

echo "╚══════════════════════════════════════════════════════════════╝"

echo ""
echo "🌐 Canvas Integration URLs:"
echo "   📡 Canvas Integration: $BASE_URL/canvas-integration"
echo "   🎨 Canvas App: $BASE_URL/canvas-app"
echo "   📊 Dashboard: $BASE_URL/"
echo ""

if [ $failed -eq 0 ]; then
    echo "🎉 All Canvas integration tests passed!"
    echo "   The HFRF Universal SDR Canvas system is working correctly."
    exit 0
else
    echo "⚠️  Some tests failed. Please check the server logs and configuration."
    exit 1
fi

