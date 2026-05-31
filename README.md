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

## Interacting with Gemini

To generate ideas, go to [Google Gemini](https://gemini.google.com/). You can use Brainstormd for different use cases and lifecycle stages. 

### Lifecycle Stages
Brainstormd is designed to act as an automated Kanban board. When an idea is processed, Gemini will read the context and automatically categorize the file into one of three top-level stages:
- **`ideation/`**: Brainstorming, early concepts, rough drafts.
- **`devtest/`**: Actively being built, tested, or experimented on.
- **`production/`**: Completed, deployed, or fully validated.

If you edit an existing idea and change its state (e.g., from an idea to something in production), the GitHub Action will automatically detect the transition and **move the file** to the correct folder!

### Prompt 1: The Standard Brainstorming Session

Use this prompt for starting a new idea from scratch:

> "Act as my personal brainstorming assistant for [YOUR TOPIC]. We will bounce ideas back and forth until the concept is solid. When an idea is validated, I will ask you to generate the 'Final Block'. That block must have a representative title on the first line, followed by the comprehensive description of the idea below in Markdown format. Finally, you must end the response with this exact reminder: **'💡 Action Required: Click the Share & Export button below, select Export to Docs, and move the generated document strictly into your \`brainstormd\` folder to trigger the synchronization!'**"

### Prompt 2: Transitioning an Existing Idea

Because Brainstormd automatically tracks file movements across stages, you don't need to start a new Google Doc or run a massive prompt just to move an idea to the next phase.

If you are already conversing with Gemini about an existing idea, you can simply tell it:
> "We've decided to move forward with this! I have promoted this project into the DevTest phase. Please generate a small update snippet that I can append to my existing document to reflect this new state."

Gemini will generate a short summary of the transition. **Just copy that snippet and paste it at the bottom of your existing Google Doc** in the `brainstormd` folder. 

Within 5 minutes, the sync will run again. The system will read the updated document, recognize the new `DevTest` status, automatically **delete** the old file from the `ideation/` folder in your GitHub repository, and recreate it in the `devtest/` folder!
### Finalizing the Sync

Once Gemini generates the Final Block for an idea that you like, follow these steps to trigger the sync:

1. Click the **Share & export** button at the bottom of Gemini's response.
2. Select **Export to Docs**. Gemini will create a new Google Doc for you.
3. Click **Open Docs** on the toast notification.
4. Click the **Move** (Folder) icon at the top next to the document title, and move the document strictly into your `brainstormd` folder.

Within 5 minutes, your Apps Script will detect the new document, convert it to Markdown, and dispatch it to your GitHub repository where the Action will autonomously categorize and commit it!

## Development

To develop locally:

- Run `pnpm build` from the root to build all packages.
- Run `pnpm lint` to run linters.
