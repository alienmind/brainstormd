#!/usr/bin/env bash
set -e

echo "Welcome to the Brainstormd Setup Script!"

# Check for required tools
if ! command -v gh &> /dev/null; then
    echo "Error: gh (GitHub CLI) could not be found. Please install it first."
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "Error: pnpm could not be found. Please install it first."
    exit 1
fi

echo "Checking GitHub authentication..."
gh auth status

echo ""
read -p "Enter the owner/repo format for your destination repository (e.g., username/my-ideas): " DEST_REPO

if [ -z "$DEST_REPO" ]; then
    echo "Destination repo cannot be empty."
    exit 1
fi

echo "Setting up repository $DEST_REPO..."

# Prompt for Google Drive Folder
read -p "Enter the Google Drive folder name to watch [brainstormd]: " DRIVE_FOLDER_NAME
DRIVE_FOLDER_NAME=${DRIVE_FOLDER_NAME:-brainstormd}

# Prompt for a GEMINI_API_KEY
read -p "Enter your Gemini API Key (used by GitHub Actions to organize ideas): " GEMINI_API_KEY
if [ -n "$GEMINI_API_KEY" ]; then
    echo "Saving API key and configuration to local .env file..."
    echo "GEMINI_API_KEY=$GEMINI_API_KEY" > .env
    echo "DRIVE_FOLDER_NAME=$DRIVE_FOLDER_NAME" >> .env
    
    echo "Generating Google Apps Script config..."
    GITHUB_TOKEN=$(gh auth token)
    echo "export const CONFIG = { DRIVE_FOLDER_NAME: \"$DRIVE_FOLDER_NAME\", GITHUB_REPO: \"$DEST_REPO\", GITHUB_TOKEN: \"$GITHUB_TOKEN\" };" > apps/google-apps-script/src/config.ts
    
    echo "Setting GEMINI_API_KEY secret in $DEST_REPO..."
    echo "$GEMINI_API_KEY" | gh secret set GEMINI_API_KEY --repo "$DEST_REPO"

    echo "Deploying GitHub Actions workflow to $DEST_REPO..."
    # Create the workflow file content
    WORKFLOW_CONTENT=$(cat .github/workflows/organize-ideas.yml | base64 -w 0)
    
    # Check if the file already exists to get its SHA (required for updating via API)
    FILE_SHA=$(gh api repos/$DEST_REPO/contents/.github/workflows/organize-ideas.yml --jq '.sha' 2>/dev/null || echo "")
    
    if [ -z "$FILE_SHA" ]; then
        gh api --method PUT -H "Accept: application/vnd.github+json" \
            repos/$DEST_REPO/contents/.github/workflows/organize-ideas.yml \
            -f message="Setup Brainstormd organizer workflow" \
            -f content="$WORKFLOW_CONTENT" > /dev/null
    else
        gh api --method PUT -H "Accept: application/vnd.github+json" \
            repos/$DEST_REPO/contents/.github/workflows/organize-ideas.yml \
            -f message="Update Brainstormd organizer workflow" \
            -f content="$WORKFLOW_CONTENT" \
            -f sha="$FILE_SHA" > /dev/null
    fi
fi

# Build local packages
echo "Building local packages..."
pnpm install
pnpm build

echo "Setup environment complete! Now we will deploy your Google Apps Script trigger..."
./scripts/deploy-gas.sh
echo "Setup complete!"
