# Push Repository to GitHub (iotistic org)

## Steps to Push to GitHub

### 1. Create Repository on GitHub
Go to: https://github.com/organizations/iotistic/repositories/new

**Repository Settings:**
- Name: `abe-genset-monitoring` (or your preferred name)
- Description: `ABE GenSet Monitoring System - Real-time dashboard and API for ComAp controllers`
- Visibility: Private (recommended) or Public
- **Do NOT** initialize with README, .gitignore, or license (we already have these)

### 2. Push Local Repository

After creating the repo on GitHub, run these commands:

```powershell
# Add the remote (replace REPO_NAME with your actual repo name)
git remote add origin https://github.com/iotistic/REPO_NAME.git

# Rename branch to main if needed
git branch -M main

# Push to GitHub
git push -u origin main
```

### 3. Configure GitHub Secrets

Go to: https://github.com/iotistic/REPO_NAME/settings/secrets/actions

Add these secrets:

#### AZURE_STATIC_WEB_APPS_API_TOKEN
```
57a1819a39365bff79f4d9ae7fe77aa5f12e1ef77a85e7b634a6ebc1146ac1e803-8fd764f9-0b64-4a0a-8546-1c20060573ba00f260301855e30f
```

#### AZURE_WEBAPP_PUBLISH_PROFILE
Get this by running:
```powershell
az webapp deployment list-publishing-profiles --name abe-genset-api --resource-group abe-genset-rg --xml
```

Copy the entire XML output and paste it as the secret value.

### 4. Trigger Deployment

Once secrets are configured, GitHub Actions will automatically deploy on every push to `main` branch.

You can also manually trigger deployment:
1. Go to: https://github.com/iotistic/REPO_NAME/actions
2. Click "Deploy ABE System to Azure"
3. Click "Run workflow"

### 5. Monitor Deployment

Watch the deployment progress at:
https://github.com/iotistic/REPO_NAME/actions

Once complete, your sites will be live at:
- **Backend API:** https://abe-genset-api.azurewebsites.net
- **Frontend Dashboard:** https://proud-sea-01855e30f.3.azurestaticapps.net

---

## Quick Commands Reference

```powershell
# Check current remote
git remote -v

# Add remote
git remote add origin https://github.com/iotistic/REPO_NAME.git

# Push to GitHub
git push -u origin main

# Get Azure publish profile for GitHub secret
az webapp deployment list-publishing-profiles --name abe-genset-api --resource-group abe-genset-rg --xml
```

## What Happens Next

1. ✅ Code is already committed locally
2. ⏳ Create repo on GitHub in iotistic org
3. ⏳ Push code to GitHub
4. ⏳ Add GitHub secrets (deployment tokens)
5. ⏳ GitHub Actions will automatically deploy both backend and frontend
6. ✅ System will be live on Azure

The GitHub Actions workflow will:
- Deploy backend API to Azure App Service (Canada Central, B1 tier)
- Deploy frontend dashboard to Azure Static Web App
- Run on every push to main branch
- Can be manually triggered via GitHub UI
