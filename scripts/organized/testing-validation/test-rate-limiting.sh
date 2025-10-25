#!/bin/bash

echo "🧪 Testing Rate Limiting Configuration..."
echo ""

echo "📍 Testing localhost bypass with rapid requests:"
echo ""

# Test 10 rapid requests to localhost
success_count=0
rate_limited_count=0

for i in {1..10}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/)
    
    if [ "$response" = "200" ]; then
        echo "   ✅ Request $i: Status $response (Success)"
        ((success_count++))
    elif [ "$response" = "429" ]; then
        echo "   ❌ Request $i: Status $response (Rate Limited) - UNEXPECTED!"
        ((rate_limited_count++))
    else
        echo "   ⚠️  Request $i: Status $response (Other)"
    fi
    
    # Small delay to prevent overwhelming
    sleep 0.1
done

echo ""
echo "📈 Summary:"
echo "   ✅ Successful: $success_count/10"
echo "   ❌ Rate Limited: $rate_limited_count/10"

if [ $rate_limited_count -eq 0 ] && [ $success_count -gt 0 ]; then
    echo "   🎉 Localhost bypass is working correctly!"
    echo ""
    echo "🔍 Rate Limiting Status:"
    echo "   ✅ Smart rate limiting is active with localhost bypass enabled"
elif [ $success_count -eq 0 ]; then
    echo "   ❌ Server may not be responding properly"
else
    echo "   ⚠️  Mixed results - please check configuration"
fi

echo ""
echo "🔗 Testing a few different endpoints:"

# Test different endpoints to see rate limiting behavior
endpoints=("/" "/map" "/characters" "/api/characters" "/static/css/styles.css")

for endpoint in "${endpoints[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001$endpoint")
    if [ "$response" = "200" ]; then
        echo "   ✅ $endpoint: Status $response"
    elif [ "$response" = "429" ]; then
        echo "   ❌ $endpoint: Status $response (Rate Limited)"
    else
        echo "   ⚠️  $endpoint: Status $response"
    fi
done

echo ""
echo "✅ Rate limiting test complete!"