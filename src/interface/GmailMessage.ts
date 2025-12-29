export interface GmailMessage {
  id: string;
  threadId: string;
  sender: string;
  senderEmail: string;
  recipient: string;
  recipientEmail: string;
  subject: string;
  preview: string;
  date: Date;
  isRead: boolean;
  hasAttachment: boolean;
  labelIds: string[];
  accountEmail?: string; // For multi-account support
}