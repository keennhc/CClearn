export interface Announcement {
  id: string;
  title: string;
  content: string;
  communityId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
}

export interface UpdateAnnouncementDto {
  title?: string;
  content?: string;
}
