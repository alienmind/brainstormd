import { IdeaPayload } from '@brainstormd/shared-types';

/**
 * Basic markdown generator for an idea
 */
export function generateMarkdown(idea: IdeaPayload): string {
  return `---
title: ${idea.title}
source: ${idea.source}
date: ${idea.timestamp}
---

# ${idea.title}

${idea.content}
`;
}
