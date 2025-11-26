require('dotenv').config();
const ABEAPI = require('../src/index');

/**
 * Authentication Flow Example
 * Demonstrates how to authenticate and get OAuth tokens
 */

async function authenticationFlow() {
  console.log('=== ComAp Cloud Identity Authentication ===\n');

  // Step 1: Initialize API with just Comap-Key (no token yet)
  console.log('Step 1: Initialize API client');
  const api = new ABEAPI({
    comapKey: process.env.COMAP_KEY
    // Note: No accessToken or loginId needed for identity endpoints
  });

  try {
    // Step 2: Check if you have an application registration
    console.log('\nStep 2: Check for existing application registration');
    try {
      const app = await api.identity.getApplication();
      console.log('✓ Found existing application:');
      console.log(`  Client ID: ${app.client_id}`);
      console.log(`  Secrets: ${app.secrets?.length || 0}`);
      
      if (app.secrets && app.secrets.length > 0) {
        app.secrets.forEach((s, i) => {
          console.log(`    ${i + 1}. ${s.displayName || 'Unnamed'}`);
          console.log(`       Expires: ${s.endDateTime}`);
          console.log(`       Hint: ${s.hint}`);
        });
      }
    } catch (error) {
      if (error.status === 404) {
        console.log('✗ No application registration found');
        console.log('\nStep 3: Creating new application registration...');
        
        const newApp = await api.identity.createApplication();
        console.log('✓ Application created!');
        console.log(`  Client ID: ${newApp.client_id}`);
        console.log('\nStep 4: Creating a secret...');
        
        const secret = await api.identity.createSecret(newApp.client_id, {
          displayName: 'API Access Key'
        });
        
        console.log('✓ Secret created!');
        console.log('⚠️  IMPORTANT: Save these credentials - secret is shown only once!');
        console.log(`  Client ID: ${newApp.client_id}`);
        console.log(`  Secret: ${secret.secret}`);
        console.log(`  Secret ID: ${secret.secretId}`);
        console.log(`  Expires: ${secret.endDateTime}`);
        console.log(`  Hint: ${secret.hint}`);
        
        // Authenticate with the new credentials
        console.log('\nStep 5: Authenticating with new credentials...');
        const token = await api.identity.authenticate(newApp.client_id, secret.secret);
        console.log('✓ Authentication successful!');
        console.log(`  Token Type: ${token.token_type}`);
        console.log(`  Expires In: ${token.expires_in} seconds (${Math.floor(token.expires_in / 3600)} hours)`);
        console.log(`  Access Token: ${token.access_token.substring(0, 50)}...`);
        
        console.log('\n📝 Add these to your .env file:');
        console.log(`CLIENT_ID=${newApp.client_id}`);
        console.log(`CLIENT_SECRET=${secret.secret}`);
        console.log(`ACCESS_TOKEN=${token.access_token}`);
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
    }
    if (error.data) {
      console.error('Details:', JSON.stringify(error.data, null, 2));
    }
  }
}

async function authenticateWithExistingCredentials() {
  console.log('\n\n=== Authenticate with Existing Credentials ===\n');

  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.log('⚠️  CLIENT_ID and CLIENT_SECRET not found in .env');
    console.log('Run the full authentication flow first to create credentials.');
    return;
  }

  const api = new ABEAPI({
    comapKey: process.env.COMAP_KEY
  });

  try {
    console.log('Authenticating...');
    const token = await api.identity.authenticate(clientId, clientSecret);
    
    console.log('✓ Authentication successful!');
    console.log(`  Token Type: ${token.token_type}`);
    console.log(`  Expires In: ${token.expires_in} seconds`);
    console.log(`  Access Token: ${token.access_token.substring(0, 50)}...`);
    
    console.log('\n💡 Use this token in your API calls:');
    console.log('const api = new ABEAPI({');
    console.log('  loginId: "your_login_id",');
    console.log(`  accessToken: "${token.access_token.substring(0, 30)}...",`);
    console.log('  comapKey: "your_comap_key"');
    console.log('});');
    
    // Test the token by listing units
    console.log('\n\n=== Testing Token with API Call ===\n');
    if (process.env.LOGIN_ID) {
      const apiWithToken = new ABEAPI({
        loginId: process.env.LOGIN_ID,
        accessToken: token.access_token,
        comapKey: process.env.COMAP_KEY
      });
      
      const units = await apiWithToken.units.list();
      console.log(`✓ Token works! Found ${units.count} units.`);
    } else {
      console.log('⚠️  LOGIN_ID not set - skipping units API test');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.status === 400) {
      console.error('⚠️  Rate limit or invalid credentials');
      console.error('Note: Only 5 authentication requests per 5 minutes allowed');
    }
  }
}

async function manageSecrets() {
  console.log('\n\n=== Manage Application Secrets ===\n');

  const api = new ABEAPI({
    comapKey: process.env.COMAP_KEY
  });

  try {
    // Get current application
    const app = await api.identity.getApplication();
    console.log(`Client ID: ${app.client_id}`);
    console.log(`Current secrets: ${app.secrets?.length || 0}/2`);

    if (app.secrets && app.secrets.length > 0) {
      console.log('\nExisting secrets:');
      app.secrets.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.displayName || 'Unnamed'}`);
        console.log(`     ID: ${s.secretId}`);
        console.log(`     Expires: ${s.endDateTime}`);
        console.log(`     Hint: ${s.hint}`);
      });
    }

    // Create a new secret (if less than 2)
    if (!app.secrets || app.secrets.length < 2) {
      console.log('\n➕ Creating new secret...');
      const newSecret = await api.identity.createSecret(app.client_id, {
        displayName: `API Key ${new Date().toISOString().split('T')[0]}`
      });
      
      console.log('✓ New secret created!');
      console.log('⚠️  SAVE THIS SECRET - it will not be shown again!');
      console.log(`  Secret ID: ${newSecret.secretId}`);
      console.log(`  Secret: ${newSecret.secret}`);
      console.log(`  Display Name: ${newSecret.displayName}`);
      console.log(`  Expires: ${newSecret.endDateTime}`);
    } else {
      console.log('\n⚠️  Maximum 2 secrets allowed. Delete one before creating another.');
    }

    // Example: Delete a secret (commented out for safety)
    // const secretIdToDelete = 'your-secret-id-here';
    // console.log('\n🗑️  Deleting secret...');
    // await api.identity.deleteSecret(app.client_id, secretIdToDelete);
    // console.log('✓ Secret deleted');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.status === 404) {
      console.error('No application registration found. Create one first.');
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--auth')) {
    await authenticateWithExistingCredentials();
  } else if (args.includes('--secrets')) {
    await manageSecrets();
  } else {
    // Default: full authentication flow
    await authenticationFlow();
  }
}

main();
