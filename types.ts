export interface ColorPalette {
  hex: string;
  name: string;
  usage: string;
}

export interface FontPairing {
  header: string;
  body: string;
  reasoning: string;
}

export interface BrandIdentity {
  companyName: string;
  missionStatement: string;
  tagline: string;
  colors: ColorPalette[];
  fonts: FontPairing[];
  logoPrompt: string;
  logoUrl?: string; // Base64 data URL
  videoUrl?: string; // URL to generated video
}

export enum ViewState {
  INPUT = 'INPUT',
  LOADING = 'LOADING',
  DASHBOARD = 'DASHBOARD',
  EDIT_IMAGE = 'EDIT_IMAGE',
  ANIMATE_VIDEO = 'ANIMATE_VIDEO'
}
