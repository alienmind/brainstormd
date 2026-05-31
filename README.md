# Brainstormd

Brainstormd is a tool for producing a knowledge base of brainstorming ideas from any LLM to Markdown. It allows you to dictate your idea to the LLM, which will automatically transforming and uploading your ideas into a structured GitHub repository full of classified markdown files.

## Features

- **Google Gemini**: This is primarily tested with the Google Gemini API and Google Integrations, however, in the future may be used with other LLMs.
- **Google Drive Integration**: Use Google Docs to store the intermediate brainstorm ideas.
- **Automated Sync**: Google Apps Script automatically detects changes and converts your Google Doc to Markdown.
- **GitHub as a Backend**: Ideas are pushed and organized to your target GitHub repository.
- **LLM Organization**: GitHub Actions orchestrates to automatically classify and file your ideas in the right folder structure.

## Architecture

This is a pnpm monorepo containing the following parts:
- `apps/google-apps-script/`: The Apps Script code that runs in Google Drive to trigger syncs.
- `apps/github-action-organizer/`: The logic run by GitHub Actions on your target repository to route ideas using an LLM.
- `packages/`: Shared types and core logic across the different apps.

## Obtaining a Gemini API Key

The GitHub Action Organizer requires a Gemini API Key to intelligently classify your ideas. Follow these steps to get one:

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click on the **Get API key** button on the left sidebar.
4. Click **Create API key** (you can create one in a new or existing Google Cloud project).
5. Copy the generated key. You will need to provide this key during the setup process below.

## Setting Up Your Own Brainstormd Flow

To set up your own flow, you'll need:
1. Your own fork or clone of this repository.
2. A **Destination Repository** on GitHub where you want to store your ideas.
3. The `gh` CLI installed and authenticated. ([Installation Guide](https://cli.github.com/manual/installation))
4. The Google Apps Script API enabled. ([Enable it here](https://script.google.com/home/usersettings))
5. Google's `clasp` CLI to deploy to Google Apps Script. (This is installed automatically via `pnpm`).

### Step 1: Clone and Install Dependencies

```bash
git clone https://github.com/alienmind/brainstormd.git
cd brainstormd
pnpm install
```

### Step 2: Setup your Flow

The setup script will prompt you for your target GitHub repository, your Gemini API key, and the Google Drive folder you want to watch. It will also automatically create and deploy the Google Apps Script project to your account.

### Step 3: Activate Google Apps Script Trigger

After `pnpm setup` completes successfully, it will print a link to your newly deployed Google Apps Script project (e.g., `https://script.google.com/d/.../edit`).

1. Open that link in your browser.
2. In the top toolbar, select the **`setupTrigger`** function from the dropdown.
3. Click the **Run** button.
4. Google will ask for permissions to access your Drive. Accept them.

Your configured brainstorm folder will be created automatically in your Google Drive, and the script will now run every 5 minutes to scan for new ideas.

### Step 4: Interacting with Gemini

To generate ideas directly into your folder, go to [Google Gemini](https://gemini.google.com/) and ensure the **Google Workspace** extension is enabled.

Use the following prompt to start your brainstorming session:

> "Act as my personal brainstorming assistant for [YOUR TOPIC]. As we generate and validate good ideas, your final task for each consolidated idea is: Use the Workspace extension to create a new Google Doc and save it strictly inside my Google Drive folder named 'brainstormd' (or your custom name). The document must have a representative title on the first line and a detailed description of the idea below."

Once Gemini creates the document, your Apps Script will detect it within 5 minutes and synchronize it to your GitHub repository.

## Development

To develop locally:

- Run `pnpm build` from the root to build all packages.
- Run `pnpm lint` to run linters.
