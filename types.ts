export interface MessageContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | MessageContentPart[];
  timestamp?: number;
}

export interface Attachment {
  id: string;
  file: File;
  previewUrl?: string;
  content?: string; // For text files
  type: 'image' | 'file';
}

export interface Chat {
  id: string;
  name: string;
  messages: Message[];
  createdAt: number;
  isPinned?: boolean;
}

export interface LMStudioModel {
  id: string;
  object: string;
  owned_by: string;
}

export interface AppSettings {
  serverUrl: string;
  currentModel: string;
}