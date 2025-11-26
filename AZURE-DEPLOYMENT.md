# Deploy ABE GenSet Monitoring System to Azure

## Prerequisites
- Azure subscription
- Azure CLI installed
- Node.js 18+ installed

## Quick Deployment

### 1. Install Azure CLI (if not installed)
```powershell
winget install Microsoft.AzureCLI
```

### 2. Login to Azure
```powershell
az login
```

### 3. Set Variables
```powershell
$RESOURCE_GROUP = "abe-genset-rg"
$LOCATION = "canadacentral"  # Canada Central region
$API_NAME = "abe-genset-api"
$FRONTEND_NAME = "abe-dashboard"
$PLAN_NAME = "abe-service-plan"
```

### 4. Create Resource Group
```powershell
az group create --name $RESOURCE_GROUP --location $LOCATION
```

### 5. Deploy Backend API (App Service)
```powershell
# Create App Service Plan (FREE TIER - F1)
az appservice plan create `
  --name $PLAN_NAME `
  --resource-group $RESOURCE_GROUP `
  --sku F1 `
  --is-linux

# Create Web App
az webapp create `
  --resource-group $RESOURCE_GROUP `
  --plan $PLAN_NAME `
  --name $API_NAME `
  --runtime "NODE:18-lts"

# Configure environment variables
az webapp config appsettings set `
  --resource-group $RESOURCE_GROUP `
  --name $API_NAME `
  --settings `
    API_BASE_URL="https://cloud.comap-control.com/api" `
    AUTH_TOKEN="your_token_here" `
    COMAP_KEY="your_key_here" `
    LOGIN_ID="your_login_here" `
    API_VERSION="v1.1" `
    PORT="8080" `
    NODE_ENV="production"

# Deploy backend code
cd server
npm install --production
Compress-Archive -Path * -DestinationPath ../backend.zip -Force
cd ..

az webapp deployment source config-zip `
  --resource-group $RESOURCE_GROUP `
  --name $API_NAME `
  --src backend.zip
```

### 6. Deploy Frontend (Static Web App)
```powershell
# Install Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Create Static Web App (FREE TIER)
az staticwebapp create `
  --name $FRONTEND_NAME `
  --resource-group $RESOURCE_GROUP `
  --location "eastus2" `
  --sku "Free"

# Deploy frontend
cd dashboard
swa deploy --app-location . --deployment-token (az staticwebapp secrets list --name $FRONTEND_NAME --resource-group $RESOURCE_GROUP --query "properties.apiKey" -o tsv)
```

### 7. Update Frontend Configuration
After deployment, update the API URL in `dashboard/app.js`:
```javascript
const API_BASE_URL = 'https://abe-genset-api.azurewebsites.net';
```

### 8. Configure CORS on Backend
Add your Static Web App URL to CORS in `server/server.js`:
```javascript
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'https://abe-dashboard.azurestaticapps.net'
    ],
    credentials: true
};
```

## Alternative: One-Click Deployment

### Using Azure Portal
1. Go to portal.azure.com
2. Click "Create a resource"
3. Search for "Web App + Database"
4. Fill in:
   - Resource Group: abe-genset-rg
   - Name: abe-genset-api
   - Runtime: Node 18 LTS
   - Region: East US
5. After creation, go to "Deployment Center" and upload your code

## Environment Variables Required
- `API_BASE_URL`: https://cloud.comap-control.com/api
- `AUTH_TOKEN`: Your ComAp API token
- `COMAP_KEY`: Your ComAp API key
- `LOGIN_ID`: Your ComAp login ID
- `API_VERSION`: v1.1
- `PORT`: 8080
- `NODE_ENV`: production

## Post-Deployment Steps

### 1. Get Your URLs
```powershell
# Backend API URL
az webapp show --name $API_NAME --resource-group $RESOURCE_GROUP --query "defaultHostName" -o tsv

# Frontend URL
az staticwebapp show --name $FRONTEND_NAME --resource-group $RESOURCE_GROUP --query "defaultHostname" -o tsv
```

### 2. Test the Deployment
```powershell
# Test backend health
Invoke-WebRequest -Uri "https://abe-genset-api.azurewebsites.net/health" -UseBasicParsing

# Open frontend
Start-Process "https://abe-dashboard.azurestaticapps.net"
```

### 3. Enable Application Insights (Monitoring)
```powershell
az monitor app-insights component create `
  --app abe-insights `
  --location $LOCATION `
  --resource-group $RESOURCE_GROUP `
  --application-type web

az webapp config appsettings set `
  --resource-group $RESOURCE_GROUP `
  --name $API_NAME `
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=(az monitor app-insights component show --app abe-insights --resource-group $RESOURCE_GROUP --query "instrumentationKey" -o tsv)
```

## GitHub Actions Deployment (Recommended)

1. Get Azure credentials:
```powershell
az ad sp create-for-rbac --name "abe-genset-deploy" --role contributor --scopes /subscriptions/{subscription-id}/resourceGroups/abe-genset-rg --sdk-auth
```

2. Add secrets to GitHub repository:
   - `AZURE_WEBAPP_PUBLISH_PROFILE`: Download from Azure Portal > App Service > Deployment Center
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`: Get from Azure Portal > Static Web App > Manage deployment token

3. Push to main branch - automatic deployment!

## Cost Estimate (FREE TIER!)
- **App Service (F1 - Free)**: $0/month ✅
  - 60 CPU minutes/day
  - 1 GB RAM
  - 1 GB storage
  - Perfect for development/testing
- **Static Web Apps (Free)**: $0/month ✅
  - 100 GB bandwidth/month
  - Custom domains
  - SSL included
- **Application Insights (Free tier)**: $0/month ✅
  - 1GB data/month
- **Total: $0/month (100% FREE!)** 🎉

### Free Tier Limitations:
- App Service F1: 60 CPU minutes per day, auto-sleep after 20 min idle
- No custom domains on App Service (use *.azurewebsites.net)
- For production, upgrade to B1 ($13/month) for 24/7 uptime

### Upgrade to Production Later:
```powershell
# Scale up to Basic B1 tier when needed
az appservice plan update --name $PLAN_NAME --resource-group $RESOURCE_GROUP --sku B1
```

## Troubleshooting

### Backend not starting
```powershell
# View logs
az webapp log tail --name $API_NAME --resource-group $RESOURCE_GROUP

# Check environment variables
az webapp config appsettings list --name $API_NAME --resource-group $RESOURCE_GROUP
```

### Frontend can't connect to backend
- Check CORS configuration in server/server.js
- Verify API_BASE_URL in dashboard/app.js
- Check Network tab in browser DevTools

## Cleanup (Delete Everything)
```powershell
az group delete --name $RESOURCE_GROUP --yes
```
