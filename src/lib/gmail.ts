import { GmailMessage } from "@/interface/GmailMessage";
import { GmailLabel, GmailMessageHeader } from "@/interface/GmailLabel";

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
 * Fetches all Gmail labels using the gmail.labels scope
 */
export async function fetchGmailLabels(accessToken: string): Promise<GmailLabel[]> {
  const response = await fetch(
    `${GMAIL_API_BASE}/users/me/labels`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to fetch labels: ${response.status} - ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.labels || [];
}

/**
 * Fetches a specific label with details (message counts)
 */
export async function fetchLabelDetails(accessToken: string, labelId: string): Promise<GmailLabel> {
  const response = await fetch(
    `${GMAIL_API_BASE}/users/me/labels/${labelId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch label ${labelId}: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetches the list of message IDs from Gmail with pagination support
 * Note: This requires gmail.readonly or gmail.addons.current.message.action scope
 */
async function fetchMessageIds(
  accessToken: string, 
  maxResults: number = 20,
  pageToken?: string
): Promise<{ ids: string[]; nextPageToken?: string }> {
  let url = `${GMAIL_API_BASE}/users/me/messages?maxResults=${maxResults}`;
  if (pageToken) {
    url += `&pageToken=${pageToken}`;
  }
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || response.statusText;
    
    // Check if it's a scope/permission error
    if (response.status === 403) {
      throw new Error(`Insufficient permissions to read messages. Please sign out and sign in again to grant required permissions. Details: ${errorMessage}`);
    }
    
    throw new Error(`Failed to fetch messages: ${response.status} - ${errorMessage}`);
  }

  const data: GmailListResponse = await response.json();
  return {
    ids: data.messages?.map((m) => m.id) || [],
    nextPageToken: data.nextPageToken
  };
}

/**
 * Fetches a single message by ID
 * Note: This requires gmail.readonly or gmail.addons.current.message.action scope
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
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || response.statusText;
    
    if (response.status === 403) {
      throw new Error(`Insufficient permissions to read message content. Details: ${errorMessage}`);
    }
    
    throw new Error(`Failed to fetch message ${messageId}: ${response.status} - ${errorMessage}`);
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
 * Parses email address string to extract name and email
 */
function parseEmailAddress(emailString: string): { name: string; email: string } {
  // Format can be: "Name <email@domain.com>" or just "email@domain.com"
  const match = emailString.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].replace(/"/g, '').trim(), email: match[2] };
  }
  return { name: emailString, email: emailString };
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

function base64UrlToUtf8(data: string): string {
  // Gmail uses base64url (RFC 4648 §5)
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  return new TextDecoder('utf-8').decode(bytes);
}

function findFirstMimePart(part: GmailMessageResponse['payload'], mimeType: string): string | undefined {
  // Single-part message
  if (part.mimeType === mimeType && part.body?.data) return part.body.data;

  // Multi-part message
  if (part.parts && part.parts.length > 0) {
    for (const p of part.parts) {
      const found = findFirstMimePart(p as any, mimeType);
      if (found) return found;
    }
  }

  return undefined;
}

function extractBodies(payload: GmailMessageResponse['payload']): { html?: string; text?: string } {
  const htmlData = findFirstMimePart(payload, 'text/html') ?? (payload.mimeType === 'text/html' ? payload.body?.data : undefined);
  const textData = findFirstMimePart(payload, 'text/plain') ?? (payload.mimeType === 'text/plain' ? payload.body?.data : undefined);

  return {
    html: htmlData ? base64UrlToUtf8(htmlData) : undefined,
    text: textData ? base64UrlToUtf8(textData) : undefined,
  };
}


/**
 * Transforms Gmail API response to our GmailMessage format
 */
function transformMessage(message: GmailMessageResponse, accountEmail?: string): GmailMessage {
  const headers = message.payload.headers;
  const from = getHeader(headers, 'From');
  const to = getHeader(headers, 'To');
  const { name: senderName, email: senderEmail } = parseEmailAddress(from);
  const { name: recipientName, email: recipientEmail } = parseEmailAddress(to);

  const { html, text } = extractBodies(message.payload);

  return {
    id: message.id,
    threadId: message.threadId,
    sender: senderName,
    senderEmail: senderEmail,
    recipient: recipientName,
    recipientEmail: recipientEmail,
    subject: getHeader(headers, 'Subject') || '(No Subject)',
    preview: message.snippet || '',
    date: new Date(parseInt(message.internalDate)),
    isRead: !message.labelIds.includes('UNREAD'),
    hasAttachment: hasAttachments(message.payload),
    labelIds: message.labelIds,
    accountEmail: accountEmail,

    bodyHtml: html, 
    bodyText: text, 
  };
}
/**
 * Fetches messages in batches to avoid rate limiting (429 errors)
 * Processes messages in batches with a delay between batches
 */
async function fetchMessagesWithThrottle(
  ids: string[],
  fetchFn: (id: string) => Promise<GmailMessageResponse>,
  batchSize: number = 10,
  delayMs: number = 300
): Promise<GmailMessageResponse[]> {
  const results: GmailMessageResponse[] = [];
  
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    try {
      const batchResults = await Promise.all(batch.map(fetchFn));
      results.push(...batchResults);
    } catch (error) {
      console.error(`Error fetching batch at index ${i}:`, error);
      // Continue with other batches instead of failing completely
    }
    
    // Add delay between batches to avoid rate limiting
    if (i + batchSize < ids.length) {
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
  
  return results;
}

/**
 * Fetches top emails from Gmail with throttling to avoid rate limits
 * Supports pagination with pageToken
 */
export async function fetchGmailMessages(
  accessToken: string,
  maxResults: number = 10,
  accountEmail?: string,
  pageToken?: string
): Promise<{ messages: GmailMessage[]; nextPageToken?: string }> {
  try {
    // Get list of message IDs with pagination
    const { ids: messageIds, nextPageToken: nextToken } = await fetchMessageIds(accessToken, maxResults, pageToken);

    if (messageIds.length === 0) {
      return { messages: [], nextPageToken: undefined };
    }

    // Fetch messages in batches of 15-20 to avoid rate limiting
    const messages = await fetchMessagesWithThrottle(
      messageIds,
      (id) => fetchMessage(accessToken, id),
      10, // batch size
      300 // delay between batches in ms
    );

    // Transform and return with account email and nextPageToken
    return {
      messages: messages.map(msg => transformMessage(msg, accountEmail)),
      nextPageToken: nextToken
    };
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

/**
 * Gets inbox statistics using labels (works with gmail.labels scope)
 */
export async function getInboxStats(accessToken: string): Promise<{
  inboxTotal: number;
  inboxUnread: number;
  labels: GmailLabel[];
}> {
  try {
    // First get all labels
    const labels = await fetchGmailLabels(accessToken);
    
    // Get detailed info for INBOX label
    const inboxLabel = labels.find(l => l.id === 'INBOX');
    let inboxStats = { messagesTotal: 0, messagesUnread: 0 };
    
    if (inboxLabel) {
      const inboxDetails = await fetchLabelDetails(accessToken, 'INBOX');
      inboxStats = {
        messagesTotal: inboxDetails.messagesTotal || 0,
        messagesUnread: inboxDetails.messagesUnread || 0,
      };
    }

    return {
      inboxTotal: inboxStats.messagesTotal,
      inboxUnread: inboxStats.messagesUnread,
      labels: labels,
    };
  } catch (error) {
    console.error('Error fetching inbox stats:', error);
    throw error;
  }
}

export async function markMessageAsRead(accessToken: string, messageId: string): Promise<void> {
  const response = await fetch(
    `${GMAIL_API_BASE}/users/me/messages/${messageId}/modify`,
    {      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        removeLabelIds: ['UNREAD'],
      }),
    }
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to mark message as read: ${response.status} - ${errorData.error?.message || response.statusText}`);
  }
}