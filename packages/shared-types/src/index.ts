export interface IdeaPayload {
  title: string;
  content: string;
  source: 'google-drive' | 'web-app';
  timestamp: string;
}

export interface GithubSyncResponse {
  success: boolean;
  message?: string;
  url?: string;
}
