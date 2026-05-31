#!/usr/bin/env bash
set -e

# Change directory to the apps script folder
cd "$(dirname "$0")/../apps/google-apps-script"

# Check for clasp
if ! command -v npx clasp &> /dev/null; then
    echo "npx clasp not found, ensure you ran pnpm install."
fi

echo "Logging in to Google (Clasp)..."
npx clasp login

echo "Creating a new Apps Script project..."
while ! npx clasp create --title "Brainstormd-Sync" --type standalone; do
    echo ""
    echo "⚠️ ERROR: Insufficient Permissions."
    echo "This usually happens for one of two reasons:"
    echo "1. You haven't enabled the Google Apps Script API. Go to: https://script.google.com/home/usersettings"
    echo "2. You didn't grant the necessary scopes/permissions during login."
    echo ""
    read -p "Do you want to re-authenticate with Google before retrying? (y/n) " REAUTH
    if [[ "$REAUTH" =~ ^[Yy]$ ]]; then
        echo "Logging in again..."
        npx clasp login
    fi
    echo "Retrying project creation..."
done

echo "Pushing code to Google Apps Script..."
npx clasp push

echo "Deployment to Google Apps Script complete!"
echo "Check the README.md (Step 3) for instructions on how to activate the trigger in the browser."
