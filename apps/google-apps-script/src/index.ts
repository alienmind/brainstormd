import { IdeaPayload } from '@brainstormd/shared-types';
import { generateMarkdown } from '@brainstormd/core-logic';
import { CONFIG } from './config';

/**
 * Ensures the target folder exists and returns it.
 */
function getOrCreateTargetFolder(): GoogleAppsScript.Drive.Folder {
  const folders = DriveApp.getFoldersByName(CONFIG.DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  // Create if it doesn't exist
  Logger.log(`Folder "${CONFIG.DRIVE_FOLDER_NAME}" not found. Creating it...`);
  return DriveApp.createFolder(CONFIG.DRIVE_FOLDER_NAME);
}

/**
 * Main synchronization function.
 * Triggered via a time-driven trigger to scan the folder for updated documents.
 */
export function syncIdeas() {
  const folder = getOrCreateTargetFolder();
  Logger.log(`Scanning folder: ${folder.getName()} for ideas...`);
  
  // Find all Google Docs in the folder
  const files = folder.searchFiles('mimeType = "application/vnd.google-apps.document"');
  
  while (files.hasNext()) {
    const file = files.next();
    const docId = file.getId();
    const doc = DocumentApp.openById(docId);
    
    // Read contents
    const title = doc.getName();
    const content = doc.getBody().getText();
    const lastUpdated = file.getLastUpdated().toISOString();
    
    const payload: IdeaPayload = {
      title,
      content,
      source: 'google-drive',
      timestamp: lastUpdated
    };
    
    // Using core logic to format as markdown
    const markdown = generateMarkdown(payload);
    
    // Send HTTP POST request to GitHub API via repository dispatch
    const url = `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/dispatches`;
    const payloadData = {
      event_type: 'brainstormd_idea',
      client_payload: {
        title: title,
        markdown: markdown,
        source: 'google-drive',
        timestamp: lastUpdated
      }
    };
    
    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': `Bearer ${CONFIG.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      payload: JSON.stringify(payloadData),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    Logger.log(`[SYNCED] ${title} - GitHub API Response: ${response.getResponseCode()} ${response.getContentText()}`);
    
    Logger.log(`[SYNCED] ${title}`);
  }
}

/**
 * Run this function ONCE from the Apps Script editor to set up the time-driven trigger.
 */
export function setupTrigger() {
  const functionName = 'syncIdeas';
  
  // Clear existing triggers to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(trigger);
    }
  }
  
  // Create a new trigger that runs every 5 minutes
  ScriptApp.newTrigger(functionName)
    .timeBased()
    .everyMinutes(5)
    .create();
    
  Logger.log(`Time-driven trigger installed successfully for ${functionName}.`);
}

// Expose functions to the Google Apps Script global scope
declare var global: any;
global.syncIdeas = syncIdeas;
global.setupTrigger = setupTrigger;
