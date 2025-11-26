# Quick Azure Deployment Script
# Run this script from the project root directory

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "abe-genset-rg",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "canadacentral",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiName = "abe-genset-api",
    
    [Parameter(Mandatory=$false)]
    [string]$FrontendName = "abe-dashboard"
)

Write-Host "🚀 Starting ABE System Deployment to Azure..." -ForegroundColor Cyan

# Check if Azure CLI is installed
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Azure CLI not found. Installing..." -ForegroundColor Yellow
    winget install Microsoft.AzureCLI
    Write-Host "✅ Azure CLI installed. Please restart PowerShell and run this script again." -ForegroundColor Green
    exit
}

# Login to Azure
Write-Host "`n📝 Logging into Azure..." -ForegroundColor Cyan
az login

# Create Resource Group
Write-Host "`n📦 Creating resource group: $ResourceGroup" -ForegroundColor Cyan
az group create --name $ResourceGroup --location $Location

# Create App Service Plan
Write-Host "`n🏗️ Creating App Service Plan (Basic B1 - Always On)..." -ForegroundColor Cyan
az appservice plan create `
    --name "$ApiName-plan" `
    --resource-group $ResourceGroup `
    --sku B1 `
    --is-linux

# Create Web App for Backend
Write-Host "`n🌐 Creating Web App for backend API..." -ForegroundColor Cyan
az webapp create `
    --resource-group $ResourceGroup `
    --plan "$ApiName-plan" `
    --name $ApiName `
    --runtime "NODE:20-lts"

# Set environment variables
Write-Host "`n⚙️ Configuring environment variables..." -ForegroundColor Cyan
Write-Host "⚠️ Please update these with your actual values in Azure Portal" -ForegroundColor Yellow

az webapp config appsettings set `
    --resource-group $ResourceGroup `
    --name $ApiName `
    --settings `
        API_BASE_URL="https://cloud.comap-control.com/api" `
        AUTH_TOKEN="UPDATE_THIS_IN_PORTAL" `
        COMAP_KEY="UPDATE_THIS_IN_PORTAL" `
        LOGIN_ID="UPDATE_THIS_IN_PORTAL" `
        API_VERSION="v1.1" `
        PORT="8080" `
        NODE_ENV="production"

# Enable Always On to prevent cold starts
Write-Host "`n⚡ Enabling Always On for faster performance..." -ForegroundColor Cyan
az webapp config set `
    --resource-group $ResourceGroup `
    --name $ApiName `
    --always-on true

# Deploy Backend
Write-Host "`n📤 Deploying backend code..." -ForegroundColor Cyan
Push-Location server
npm install --production

if (Test-Path ../backend.zip) {
    Remove-Item ../backend.zip
}

Compress-Archive -Path * -DestinationPath ../backend.zip -Force
Pop-Location

az webapp deployment source config-zip `
    --resource-group $ResourceGroup `
    --name $ApiName `
    --src backend.zip

Remove-Item backend.zip

# Create Static Web App for Frontend
Write-Host "`n🎨 Creating Static Web App for frontend (Free Tier)..." -ForegroundColor Cyan
az staticwebapp create `
    --name $FrontendName `
    --resource-group $ResourceGroup `
    --location "eastus2" `
    --sku "Free"

# Get deployment token for Static Web App
Write-Host "`n📤 Deploying frontend to Static Web App..." -ForegroundColor Cyan
$deploymentToken = az staticwebapp secrets list `
    --name $FrontendName `
    --resource-group $ResourceGroup `
    --query "properties.apiKey" -o tsv

# Install Static Web Apps CLI if not installed
if (-not (Get-Command swa -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Static Web Apps CLI..." -ForegroundColor Yellow
    npm install -g @azure/static-web-apps-cli
}

# Deploy frontend files
Push-Location dashboard
swa deploy --deployment-token $deploymentToken --app-location . --no-use-keychain
Pop-Location

Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green

# Get URLs
Write-Host "`n✅ Deployment Complete!" -ForegroundColor Green
Write-Host "`n📋 Your Application URLs:" -ForegroundColor Cyan

$backendUrl = az webapp show --name $ApiName --resource-group $ResourceGroup --query "defaultHostName" -o tsv
$frontendUrl = az staticwebapp show --name $FrontendName --resource-group $ResourceGroup --query "defaultHostname" -o tsv

Write-Host "Backend API: https://$backendUrl" -ForegroundColor White
Write-Host "Frontend Dashboard: https://$frontendUrl" -ForegroundColor White

Write-Host "`n⚠️ Important Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update environment variables in Azure Portal with your actual API credentials"
Write-Host "2. Update dashboard/app.js with backend URL: https://$backendUrl"
Write-Host "3. Update server/server.js CORS origin with: https://$frontendUrl"
Write-Host "4. Redeploy after updating URLs for full functionality"
Write-Host "`n📚 See AZURE-DEPLOYMENT.md for detailed instructions"

Write-Host "`n🔗 Open Azure Portal to manage your resources:"
Start-Process "https://portal.azure.com/#@/resource/subscriptions//resourceGroups/$ResourceGroup/overview"
