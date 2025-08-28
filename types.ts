
export interface ClosetItem {
  id: string;
  image: string; // base64 data URL
  mimeType: string;
  tags: string[];
}

export enum Mode {
  Full = 'full',
  Selective = 'selective',
  Exclusion = 'exclusion',
}
