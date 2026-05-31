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
    echo "export const CONFIG = { DRIVE_FOLDER_NAME: \"$DRIVE_FOLDER_NAME\" };" > apps/google-apps-script/src/config.ts
    
    echo "Setting GEMINI_API_KEY secret in $DEST_REPO..."
    echo "$GEMINI_API_KEY" | gh secret set GEMINI_API_KEY --repo "$DEST_REPO"
fi

# Build local packages
echo "Building local packages..."
pnpm install
pnpm build

echo "Setup environment complete! Now we will deploy your Google Apps Script trigger..."
./scripts/deploy-gas.sh
echo "Setup complete!"
