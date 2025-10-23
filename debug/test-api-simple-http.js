const http = require('http');

function testGalleryAPI() {
    console.log('🔍 Testing Gallery API...');
    
    const token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjBmNTBjYzNhNWEwNDEyNzAzOGJhY2Y5YzJiMzNlNGJkZTUzOTVkODgiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiTWFyayBJbWVsIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0lLY3FQcENIZG9yWVV0dk5JLVFSY2Y3Q01iN3RDOElJLVo5ajFJSEtmdnBKR29wLU1PPXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL3dhdmVsZW5ndGgtbG9yZSIsImF1ZCI6IndhdmVsZW5ndGgtbG9yZSIsImF1dGhfdGltZSI6MTcyOTY0NTExOCwidXNlcl9pZCI6IjRmZGJZeEpIakVQNHhrc2s5c2dGRTNsZ1lVczIiLCJzdWIiOiI0ZmRiWXhKSGpFUDR4a3NrOXNnRkUzbGdZVXMyIiwiaWF0IjoxNzI5NjQ1MTE4LCJleHAiOjE3Mjk2NDg3MTgsImVtYWlsIjoibWltZWxAaW1lbHNoaXJlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTE3OTI1NDQ4Njk2MTgyNzEwMDA0Il0sImVtYWlsIjpbIm1pbWVsQGltZWxzaGlyZS5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.MXKcqgWukipSBKQizW5vnD2bJ1sYPtHDjVWGZLQEsHPWKWEGSl5-VBc6eVDnxShfNhUzYUzlNcS5ovp9bJKfyRkBs9eAOvTaLmCYv6RkVgg7KPmJNW6j6Pr0vV_gWIBCyqWnfoET_BxSyAfSC-a9_EZkgEJ-LP6S0v7UYLapQqLW4aqtXY1XT0KpsXtLKiIrJJBZoI7iQjeybZISPSph_FlPTQGUPFQVShJANWELlaO8ApEmnwtKs_bgpFDJgpa6JpecoxpQnzQW2zTz4nmMLQCowEPiZe5VeXqHpqEPGrIbMuQSSUQWUok-R8YWCNLh_WOqT9aRreEGB5-chxPCGQ';
    
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/gallery/user/images',
        method: 'GET',
        headers: {
            'Cookie': `__session=${token}`,
            'Accept': 'application/json'
        }
    };
    
    const req = http.request(options, (res) => {
        console.log(`📡 Response Status: ${res.statusCode} ${res.statusMessage}`);
        console.log('📋 Response Headers:');
        for (const [name, value] of Object.entries(res.headers)) {
            console.log(`  ${name}: ${value}`);
        }
        
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('📄 Response Data:');
            try {
                const jsonData = JSON.parse(data);
                console.log(JSON.stringify(jsonData, null, 2));
                
                if (jsonData.images) {
                    console.log(`\n📊 Found ${jsonData.images.length} images:`);
                    jsonData.images.forEach((img, i) => {
                        console.log(`  ${i + 1}. ${img.title || 'Untitled'}`);
                        console.log(`     URL: ${img.url}`);
                        console.log(`     Path: ${img.relativePath}`);
                        console.log(`     Size: ${img.sizeFormatted || 'Unknown'}`);
                    });
                }
            } catch (error) {
                console.log('Raw response:', data);
            }
        });
    });
    
    req.on('error', (error) => {
        console.error('❌ Request failed:', error.message);
    });
    
    req.end();
}

testGalleryAPI();