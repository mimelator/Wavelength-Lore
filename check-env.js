// Check if environment variables are loaded correctly
require('dotenv').config();

console.log('Checking environment variables:');
console.log('===================================');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set ✅' : 'Not set ❌');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set ✅' : 'Not set ❌');
console.log('ACCESS_KEY_ID:', process.env.ACCESS_KEY_ID ? 'Set ✅' : 'Not set ❌');
console.log('SECRET_ACCESS_KEY:', process.env.SECRET_ACCESS_KEY ? 'Set ✅' : 'Not set ❌');
console.log('AWS_REGION:', process.env.AWS_REGION || 'Not set, using default: us-east-1');
console.log('GALLERY_S3_BUCKET:', process.env.GALLERY_S3_BUCKET || 'Not set, using fallbacks');
console.log('===================================');

console.log('\nCredentials to be used by S3Client:');
console.log('Access Key ID:', process.env.ACCESS_KEY_ID || 'undefined');
console.log('Secret Access Key:', process.env.SECRET_ACCESS_KEY ? '[HIDDEN]' : 'undefined');