# Authentication Guide

Complete guide for authenticating with the ComAp ABE API.

## Overview

The ABE API uses OAuth 2.0 authentication with Bearer tokens. There are two ways to authenticate:

1. **OAuth Flow** (Recommended) - Create application credentials via the Identity API
2. **Manual** - Use existing credentials if you already have them

## OAuth Authentication Flow

### Step 1: Get Your Subscription Key

Your **Comap-Key** (subscription key) is required for all API calls. Find it in your ABE user profile.

### Step 2: Create Application Registration

Run the authentication script:

```bash
npm run auth
```

This will:
1. Check for existing application registration
2. Create a new application if needed
3. Generate a client secret
4. Authenticate and get an access token
5. Display credentials to save

**Output example:**
```
⚠️  IMPORTANT: Save these credentials - secret is shown only once!
  Client ID: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
  Secret: your_secret_here
  Secret ID: ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj
  Expires: 2027-11-25T10:30:00Z
  Hint: Ab[
```

### Step 3: Save Credentials to .env

Add the credentials to your `.env` file:

```env
COMAP_KEY=your_subscription_key
LOGIN_ID=your_login_id
CLIENT_ID=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
CLIENT_SECRET=your_secret_here
ACCESS_TOKEN=generated_access_token
```

### Step 4: Authenticate When Needed

Access tokens expire after a period. Re-authenticate to get a new token:

```bash
npm run auth:login
```

Or in your code:

```javascript
const api = new ABEAPI({
  comapKey: process.env.COMAP_KEY
});

const token = await api.identity.authenticate(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET
);

// Use the new token
const apiWithToken = new ABEAPI({
  loginId: process.env.LOGIN_ID,
  accessToken: token.access_token,
  comapKey: process.env.COMAP_KEY
});
```

## Identity API Methods

### `identity.authenticate(clientId, secret)`

Get an OAuth access token.

**Rate Limit:** 5 requests per 5 minutes

```javascript
const token = await api.identity.authenticate(clientId, secret);
console.log(token.access_token);
console.log(token.expires_in); // seconds until expiration
```

**Returns:**
```json
{
  "token_type": "Bearer",
  "expires_in": 3600,
  "ext_expires_in": 3600,
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### `identity.getApplication()`

Get your application registration details.

```javascript
const app = await api.identity.getApplication();
console.log(app.client_id);
console.log(app.secrets); // Array of secrets (without secret text)
```

**Returns:**
```json
{
  "client_id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "secrets": [
    {
      "secretId": "ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj",
      "displayName": "API Access Key",
      "endDateTime": "2027-11-25T10:30:00Z",
      "hint": "Ab["
    }
  ]
}
```

### `identity.createApplication()`

Create a new application registration.

```javascript
const app = await api.identity.createApplication();
console.log(app.client_id);
```

### `identity.deleteApplication()`

Delete your application registration.

```javascript
await api.identity.deleteApplication();
```

### `identity.createSecret(clientId, options)`

Create a new application secret (max 2 per application).

**⚠️ Important:** The secret text is only returned during creation and cannot be retrieved later!

```javascript
const secret = await api.identity.createSecret(clientId, {
  displayName: 'Production API Key',
  duration: '2y' // Optional, currently unsupported
});

console.log(secret.secret); // SAVE THIS!
console.log(secret.secretId);
console.log(secret.endDateTime);
```

**Returns:**
```json
{
  "secretId": "ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj",
  "displayName": "Production API Key",
  "secret": "your_secret_here_only_shown_once",
  "endDateTime": "2027-11-25T10:30:00Z",
  "hint": "Ab["
}
```

### `identity.deleteSecret(clientId, secretId)`

Delete a specific secret.

```javascript
await api.identity.deleteSecret(clientId, secretId);
```

## Managing Secrets

### List Existing Secrets

```bash
npm run auth:secrets
```

### Create Additional Secret

You can have up to 2 secrets per application. This allows rotation without downtime:

1. Create a second secret
2. Update your applications to use the new secret
3. Delete the old secret

```javascript
// Get current secrets
const app = await api.identity.getApplication();
console.log(`Secrets: ${app.secrets.length}/2`);

// Create new secret if space available
if (app.secrets.length < 2) {
  const newSecret = await api.identity.createSecret(app.client_id, {
    displayName: 'New API Key'
  });
  console.log('New secret:', newSecret.secret); // Save this!
}
```

### Rotate Secrets

```javascript
// 1. Create new secret
const newSecret = await api.identity.createSecret(clientId, {
  displayName: 'Rotated Key'
});

// 2. Update your .env or deployment with new secret
console.log('Update CLIENT_SECRET to:', newSecret.secret);

// 3. After all services are updated, delete old secret
const app = await api.identity.getApplication();
const oldSecretId = app.secrets.find(s => s.displayName === 'Old Key').secretId;
await api.identity.deleteSecret(clientId, oldSecretId);
```

## Complete Authentication Example

```javascript
require('dotenv').config();
const ABEAPI = require('./src/index');

async function authenticateAndUseAPI() {
  // Step 1: Initialize with just Comap-Key
  const authApi = new ABEAPI({
    comapKey: process.env.COMAP_KEY
  });

  // Step 2: Authenticate to get access token
  const token = await authApi.identity.authenticate(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET
  );

  console.log(`Token expires in ${token.expires_in} seconds`);

  // Step 3: Use the token for API calls
  const api = new ABEAPI({
    loginId: process.env.LOGIN_ID,
    accessToken: token.access_token,
    comapKey: process.env.COMAP_KEY
  });

  // Step 4: Make API calls
  const units = await api.units.list();
  console.log(`Found ${units.count} units`);

  const values = await api.units.getValues(units.units[0].unitGuid);
  console.log('Unit values:', values);
}

authenticateAndUseAPI().catch(console.error);
```

## Token Expiration Handling

Tokens expire after a period (specified in `expires_in`). Handle expiration:

```javascript
class APIManager {
  constructor(config) {
    this.config = config;
    this.token = null;
    this.tokenExpiry = null;
  }

  async ensureAuthenticated() {
    const now = Date.now();
    
    // Refresh token if expired or about to expire (5 min buffer)
    if (!this.token || !this.tokenExpiry || this.tokenExpiry - now < 300000) {
      console.log('Refreshing token...');
      
      const authApi = new ABEAPI({
        comapKey: this.config.comapKey
      });
      
      const tokenData = await authApi.identity.authenticate(
        this.config.clientId,
        this.config.clientSecret
      );
      
      this.token = tokenData.access_token;
      this.tokenExpiry = now + (tokenData.expires_in * 1000);
    }
    
    return this.token;
  }

  async getAPI() {
    const token = await this.ensureAuthenticated();
    
    return new ABEAPI({
      loginId: this.config.loginId,
      accessToken: token,
      comapKey: this.config.comapKey
    });
  }
}

// Usage
const manager = new APIManager({
  loginId: process.env.LOGIN_ID,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  comapKey: process.env.COMAP_KEY
});

const api = await manager.getAPI();
const units = await api.units.list();
```

## Troubleshooting

### 404 - No Application Registration

Create an application:
```bash
npm run auth
```

### 400 - Bad Request

Common causes:
- Invalid client ID or secret
- Rate limit exceeded (5 requests per 5 minutes for authenticate)
- Trying to create more than 2 secrets

### 401 - Unauthorized

- Access token expired - re-authenticate
- Invalid Comap-Key subscription key
- Wrong credentials

### Rate Limiting

The authenticate endpoint is limited to **5 requests per 5 minutes**. If you hit this limit:

1. Wait 5 minutes before retrying
2. Cache tokens and reuse them until expiration
3. Implement proper token refresh logic

## Best Practices

1. **Cache Tokens** - Don't authenticate on every request
2. **Monitor Expiration** - Refresh tokens before they expire
3. **Rotate Secrets** - Periodically rotate secrets for security
4. **Use Environment Variables** - Never hardcode credentials
5. **Handle Rate Limits** - Implement retry logic with backoff
6. **Secure Storage** - Store secrets securely (use secrets manager in production)

## Security Notes

⚠️ **Important Security Guidelines:**

- Never commit `.env` files or secrets to version control
- Store secrets in secure vaults (Azure Key Vault, AWS Secrets Manager, etc.)
- Rotate secrets periodically
- Use separate credentials for dev/staging/production
- Monitor authentication logs for suspicious activity
- Revoke compromised secrets immediately

## Quick Reference

```bash
# Create application & get credentials
npm run auth

# Authenticate with existing credentials
npm run auth:login

# Manage secrets
npm run auth:secrets
```

```javascript
// Authenticate
const token = await api.identity.authenticate(clientId, secret);

// Get application
const app = await api.identity.getApplication();

// Create secret
const secret = await api.identity.createSecret(clientId, { displayName: 'Key' });

// Delete secret
await api.identity.deleteSecret(clientId, secretId);
```
