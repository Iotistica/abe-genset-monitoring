# Identity API - Quick Reference

Quick reference for the ComAp Cloud Identity authentication API.

## Setup Authentication

### One-Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Create OAuth credentials
npm run auth

# 3. Save credentials to .env
# (displayed by the auth script)
```

### Daily Usage

```bash
# Re-authenticate when token expires
npm run auth:login

# Manage secrets
npm run auth:secrets
```

## Code Examples

### Basic Authentication

```javascript
const ABEAPI = require('./src/index');

// Initialize with just Comap-Key
const api = new ABEAPI({
  comapKey: process.env.COMAP_KEY
});

// Authenticate
const token = await api.identity.authenticate(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET
);

// Use token for API calls
const apiWithToken = new ABEAPI({
  loginId: process.env.LOGIN_ID,
  accessToken: token.access_token,
  comapKey: process.env.COMAP_KEY
});

const units = await apiWithToken.units.list();
```

### Application Management

```javascript
// Get application info
const app = await api.identity.getApplication();
console.log(app.client_id);
console.log(app.secrets); // Max 2 secrets

// Create application (if none exists)
const newApp = await api.identity.createApplication();
console.log(newApp.client_id);

// Delete application
await api.identity.deleteApplication();
```

### Secret Management

```javascript
// Create secret (max 2 per application)
const secret = await api.identity.createSecret(clientId, {
  displayName: 'Production API Key'
});

// ⚠️ IMPORTANT: Save the secret - it's shown only once!
console.log('Client ID:', clientId);
console.log('Secret:', secret.secret);
console.log('Expires:', secret.endDateTime);

// Delete secret
await api.identity.deleteSecret(clientId, secretId);
```

### Token Auto-Refresh

```javascript
class TokenManager {
  constructor(config) {
    this.config = config;
    this.token = null;
    this.expiry = null;
  }

  async getToken() {
    const now = Date.now();
    
    // Refresh if expired or expiring soon (5 min buffer)
    if (!this.token || this.expiry - now < 300000) {
      const api = new ABEAPI({
        comapKey: this.config.comapKey
      });
      
      const data = await api.identity.authenticate(
        this.config.clientId,
        this.config.secret
      );
      
      this.token = data.access_token;
      this.expiry = now + (data.expires_in * 1000);
    }
    
    return this.token;
  }
}

// Usage
const manager = new TokenManager({
  clientId: process.env.CLIENT_ID,
  secret: process.env.CLIENT_SECRET,
  comapKey: process.env.COMAP_KEY
});

const token = await manager.getToken();
```

## API Methods Reference

| Method | Description | Rate Limit |
|--------|-------------|------------|
| `authenticate(clientId, secret)` | Get OAuth token | 5 per 5 min |
| `getApplication()` | Get app registration | Normal |
| `createApplication()` | Create app | Normal |
| `deleteApplication()` | Delete app | Normal |
| `createSecret(clientId, opts)` | Create secret (max 2) | Normal |
| `deleteSecret(clientId, secretId)` | Delete secret | Normal |

## Response Formats

### authenticate()
```json
{
  "token_type": "Bearer",
  "expires_in": 3600,
  "ext_expires_in": 3600,
  "access_token": "eyJ0eXAiOiJKV1Qi..."
}
```

### getApplication()
```json
{
  "client_id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "secrets": [
    {
      "secretId": "ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj",
      "displayName": "API Key",
      "endDateTime": "2027-11-25T10:30:00Z",
      "hint": "Ab["
    }
  ]
}
```

### createSecret()
```json
{
  "secretId": "ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj",
  "displayName": "API Key",
  "secret": "your_secret_only_shown_once",
  "endDateTime": "2027-11-25T10:30:00Z",
  "hint": "Ab["
}
```

## Environment Variables

```env
# Required for all
COMAP_KEY=your_subscription_key

# For OAuth authentication
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret

# For API calls
LOGIN_ID=your_login_id
ACCESS_TOKEN=your_bearer_token
```

## Common Tasks

### First Time Setup
```bash
npm install
npm run auth
# Copy credentials to .env
```

### Get New Token
```bash
npm run auth:login
```

### Rotate Secrets
```bash
npm run auth:secrets  # List current secrets
# Create new secret
# Update .env with new secret
# Delete old secret
```

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad request / Rate limit | Check credentials / Wait 5 minutes |
| 401 | Unauthorized | Invalid token / Re-authenticate |
| 404 | No application | Create application first |

## Limits & Constraints

- ⚠️ **Rate Limit**: 5 authentication requests per 5 minutes
- ⚠️ **Max Secrets**: 2 secrets per application
- ⚠️ **Secret Display**: Secret text shown only during creation
- ⚠️ **Token Expiry**: Tokens expire (check `expires_in`)

## Security Best Practices

✅ Never commit secrets to git  
✅ Store secrets in secure vault  
✅ Rotate secrets regularly  
✅ Use separate credentials per environment  
✅ Monitor authentication logs  
✅ Revoke compromised secrets immediately  

## Quick Commands

```bash
# Authentication
npm run auth              # Full setup flow
npm run auth:login        # Just authenticate
npm run auth:secrets      # Manage secrets

# Examples
npm run example:basic     # Test API
npm run example:monitor   # Monitor units
```

## Support

For more details see:
- [Complete Authentication Guide](./AUTHENTICATION.md)
- [API Reference](./API_REFERENCE.md)
- [Main README](../README.md)

Email: api@ABE.net
