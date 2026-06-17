export enum AttachmentType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  GIF = 'GIF',
  FILE = 'FILE',
}

export interface CommunityMessage {
  id: string;
  message: string | null;
  userId: string;
  userName: string;
  userRole: string;
  attachmentUrl: string | null;
  attachmentType: AttachmentType | null;
  attachmentName: string | null;
  createdAt: string;
}

export interface CreateMessageDto {
  message?: string;
  attachmentUrl?: string;
  attachmentType?: AttachmentType;
  attachmentName?: string;
}
