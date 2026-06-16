export interface CommunityMessage {
  id: string;
  message: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface CreateMessageDto {
  message: string;
}
