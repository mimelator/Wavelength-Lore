const { AppRunnerClient, DescribeServiceCommand } = require('@aws-sdk/client-apprunner');

async function testCredentials() {
  try {
    console.log('🔍 Testing AWS credentials for App Runner access...');
    
    const client = new AppRunnerClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    const serviceArn = process.env.APPRUNNER_SERVICE_ARN;
    if (!serviceArn) {
      console.log('❌ APPRUNNER_SERVICE_ARN not set in environment');
      return;
    }
    
    const command = new DescribeServiceCommand({ ServiceArn: serviceArn });
    const result = await client.send(command);
    
    console.log('✅ AWS credentials working!');
    console.log('📊 Service Status:', result.Service.Status);
    console.log('🐳 Current Image:', result.Service.SourceConfiguration.ImageRepository.ImageIdentifier);
    
  } catch (error) {
    console.log('❌ AWS credential test failed:', error.name);
    console.log('   Message:', error.message);
    
    if (error.name === 'UnauthorizedOperation' || error.name === 'AccessDenied') {
      console.log('🚨 CREDENTIAL ISSUE: Access denied - credentials may be revoked');
    }
  }
}

testCredentials();