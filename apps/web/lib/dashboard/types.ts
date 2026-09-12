export type EditorVideo = {
  id: string;
  title: string | null;
  originalFileName: string;
  originalS3Key: string;
  originalMimeType: string | null;
  originalSize: number | null;
  previewPrefix: string | null;
  masterPlaylistKey: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type Channel = {
  channelId: string | null;
  channelTitle: string | null;
  googleAccountEmail: string | null;
  connected: boolean;
};

export type Creator = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  channel: Channel | null;
};

export type VideoDetail = EditorVideo & {
  creator: Creator;
};

export type GetEditorVideosResponse = {
  videos: EditorVideo[];
};

export type LinkedCreator = {
  id: string;
  name: string | null;
  email: string;
  linkedAt: string;
};

export type GetLinksResponse = {
  creators?: LinkedCreator[];
  editors?: LinkedCreator[];
};

export type CreatorVideo = EditorVideo & {
  editorId: string;
  editorName: string | null;
  editorEmail: string;
};

export type GetCreatorVideosResponse = {
  videos: CreatorVideo[];
};

export type LinkCreatorResponse = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  alreadyLinked: boolean;
};