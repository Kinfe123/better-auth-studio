#!/usr/bin/env node

const http = require('http');

async function testConfigEndpoint() {
  console.log('🧪 Testing /api/config endpoint...\n');

  try {
    const response = await fetch('http://localhost:3002/api/config');

    if (response.ok) {
      const config = await response.json();

      console.log('✅ Config endpoint is working!');
      console.log('📊 Configuration Data:');
      console.log('====================');

      // Display key configuration sections
      console.log(`\n🏷️  App Name: ${config.appName || 'Not set'}`);
      console.log(`🌐 Base URL: ${config.baseURL || 'Not set'}`);
      console.log(`🔑 Secret: ${config.secret || 'Not set'}`);

      console.log(`\n🗄️  Database:`);
      console.log(`   Type: ${config.database?.type || 'Unknown'}`);
      console.log(`   Dialect: ${config.database?.dialect || 'Unknown'}`);
      console.log(`   Casing: ${config.database?.casing || 'Unknown'}`);
      console.log(`   Debug Logs: ${config.database?.debugLogs ? 'Enabled' : 'Disabled'}`);

      console.log(`\n📧 Email & Password:`);
      console.log(`   Enabled: ${config.emailAndPassword?.enabled ? 'Yes' : 'No'}`);
      console.log(`   Sign Up: ${config.emailAndPassword?.disableSignUp ? 'Disabled' : 'Enabled'}`);
      console.log(
        `   Email Verification: ${config.emailAndPassword?.requireEmailVerification ? 'Required' : 'Optional'}`
      );
      console.log(
        `   Password Length: ${config.emailAndPassword?.minPasswordLength || 8} - ${config.emailAndPassword?.maxPasswordLength || 128}`
      );

      console.log(`\n🔐 Social Providers:`);
      if (config.socialProviders && config.socialProviders.length > 0) {
        config.socialProviders.forEach((provider) => {
          console.log(
            `   ${provider.type}: ${provider.clientId ? 'Configured' : 'Not configured'}`
          );
        });
      } else {
        console.log('   No providers configured');
      }

      console.log(`\n⏱️  Session:`);
      console.log(
        `   Duration: ${config.session?.expiresIn ? Math.floor(config.session.expiresIn / (60 * 60 * 24)) + ' days' : '7 days'}`
      );
      console.log(
        `   Update Age: ${config.session?.updateAge ? Math.floor(config.session.updateAge / (60 * 60)) + ' hours' : '24 hours'}`
      );
      console.log(`   Refresh: ${config.session?.disableSessionRefresh ? 'Disabled' : 'Enabled'}`);
      console.log(`   Store in DB: ${config.session?.storeSessionInDatabase ? 'Yes' : 'No'}`);

      console.log(`\n🛡️  Rate Limiting:`);
      console.log(`   Enabled: ${config.rateLimit?.enabled ? 'Yes' : 'No'}`);
      if (config.rateLimit?.enabled) {
        console.log(`   Window: ${config.rateLimit.window || 10} seconds`);
        console.log(`   Max Requests: ${config.rateLimit.max || 100}`);
        console.log(`   Storage: ${config.rateLimit.storage || 'memory'}`);
      }

      console.log(`\n🔧 Advanced:`);
      console.log(
        `   Secure Cookies: ${config.advanced?.useSecureCookies ? 'Enabled' : 'Disabled'}`
      );
      console.log(`   CSRF Check: ${config.advanced?.disableCSRFCheck ? 'Disabled' : 'Enabled'}`);
      console.log(
        `   IP Tracking: ${config.advanced?.ipAddress?.disableIpTracking ? 'Disabled' : 'Enabled'}`
      );

      console.log(`\n📊 Telemetry:`);
      console.log(`   Enabled: ${config.telemetry?.enabled ? 'Yes' : 'No'}`);

      console.log(`\n✅ Configuration loaded successfully!`);
    } else {
      console.error(`❌ Config endpoint failed with status: ${response.status}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
    }
  } catch (error) {
    console.error('❌ Failed to test config endpoint:', error.message);
    console.log('\n💡 Make sure the Better Auth Studio is running on http://localhost:3002');
  }
}

// Run the test
testConfigEndpoint();
