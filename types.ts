
export interface GenerationResult {
  description8K: string;
  suggestedTechnicalSpecs: string[];
}

export enum AspectRatio {
  RATIO_16_9 = '16:9 (Landscape)',
  RATIO_4_3 = '4:3 (Traditional)',
  RATIO_1_1 = '1:1 (Square)',
  RATIO_3_4 = '3:4 (Portrait)',
  RATIO_9_16 = '9:16 (Tall Portrait)',
}

export interface ImageFile {
  file: File;
  base64: string;
  url: string;
}
