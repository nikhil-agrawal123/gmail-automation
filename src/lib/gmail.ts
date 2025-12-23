// Gmail API service for fetching emails

export interface GmailMessage {
  id: string;
  threadId: string;
  sender: string;
  senderEmail: string;
  subject: string;
  preview: string;
  date: Date;
  isRead: boolean;
  hasAttachment: boolean;
  labelIds: string[];
}

interface GmailMessageHeader {
  name: string;
  value: string;
}

interface GmailMessagePart {
  partId: string;
  mimeType: string;
  filename: string;
  headers: GmailMessageHeader[];
  body: {
    size: number;
    data?: string;
  };
  parts?: GmailMessagePart[];
}

interface GmailMessageResponse {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    partId: string;
    mimeType: string;
    filename: string;
    headers: GmailMessageHeader[];
    body: {
      size: number;
      data?: string;
    };
    parts?: GmailMessagePart[];
  };
  internalDate: string;
}

interface GmailListResponse {
  messages: { id: string; threadId: string }[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';

/**
 * Fetches the list of message IDs from Gmail
 */
async function fetchMessageIds(accessToken: string, maxResults: number = 20): Promise<string[]> {
  const response = await fetch(
    `${GMAIL_API_BASE}/users/me/messages?maxResults=${maxResults}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
  }

  const data: GmailListResponse = await response.json();
  return data.messages?.map((m) => m.id) || [];
}

/**
 * Fetches a single message by ID
 */
async function fetchMessage(accessToken: string, messageId: string): Promise<GmailMessageResponse> {
  const response = await fetch(
    `${GMAIL_API_BASE}/users/me/messages/${messageId}?format=full`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch message ${messageId}: ${response.status}`);
  }

  return response.json();
}

/**
 * Extracts header value from message headers
 */
function getHeader(headers: GmailMessageHeader[], name: string): string {
  const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return header?.value || '';
}

/**
 * Parses sender string to extract name and email
 */
function parseSender(from: string): { name: string; email: string } {
  // Format can be: "Name <email@domain.com>" or just "email@domain.com"
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].replace(/"/g, '').trim(), email: match[2] };
  }
  return { name: from, email: from };
}

/**
 * Checks if message has attachments
 */
function hasAttachments(payload: GmailMessageResponse['payload']): boolean {
  if (payload.parts) {
    return payload.parts.some(
      (part) => part.filename && part.filename.length > 0
    );
  }
  return false;
}

/**
 * Transforms Gmail API response to our GmailMessage format
 */
function transformMessage(message: GmailMessageResponse): GmailMessage {
  const headers = message.payload.headers;
  const from = getHeader(headers, 'From');
  const { name, email } = parseSender(from);

  return {
    id: message.id,
    threadId: message.threadId,
    sender: name,
    senderEmail: email,
    subject: getHeader(headers, 'Subject') || '(No Subject)',
    preview: message.snippet || '',
    date: new Date(parseInt(message.internalDate)),
    isRead: !message.labelIds.includes('UNREAD'),
    hasAttachment: hasAttachments(message.payload),
    labelIds: message.labelIds,
  };
}

/**
 * Fetches top emails from Gmail
 */
export async function fetchGmailMessages(
  accessToken: string,
  maxResults: number = 20
): Promise<GmailMessage[]> {
  try {
    // Get list of message IDs
    const messageIds = await fetchMessageIds(accessToken, maxResults);

    if (messageIds.length === 0) {
      return [];
    }

    // Fetch all messages in parallel
    const messagePromises = messageIds.map((id) => fetchMessage(accessToken, id));
    const messages = await Promise.all(messagePromises);

    // Transform and return
    return messages.map(transformMessage);
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    throw error;
  }
}

/**
 * Formats relative time for display
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
