export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface TextFieldConfig {
  textX: number;
  textBaselineY: number;
  fontSize?: number;
  uppercase?: boolean;
  maxWidth?: number;
  lineHeight?: number;
}

export interface PhotoFieldConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  fit: "cover";
}

export interface TemplateConfig {
  id: string;
  name: string;
  pdfPageIndex: number;
  rolePrefix: "MA" | "BL";
  pageWidth: number;
  pageHeight: number;
  fontSize: number;
  textColor: RgbColor;
  fields: {
    vorname: TextFieldConfig;
    nachname: TextFieldConfig;
    bereich: TextFieldConfig;
    rolle: TextFieldConfig;
    id_line: TextFieldConfig;
    mhd: TextFieldConfig;
    photo: PhotoFieldConfig;
  };
}

export interface PersonRecord {
  nachname: string;
  vorname: string;
  bereich: string;
  rolle: string;
  photoFilename: string;
  id?: string;
  gueltig_bis?: string;
  rowIndex: number;
}

export interface ValidationError {
  rowIndex: number;
  field?: string;
  message: string;
  severity: "error" | "warning";
}

export interface GenerateOptions {
  startId: number;
  mhd: string;
}

export interface GenerateRequest {
  records: PersonRecord[];
  photos: Record<string, Buffer>;
  options: GenerateOptions;
  mode: "preview" | "batch";
  previewRoles?: ("MA" | "BL")[];
}

export interface GenerateResult {
  pdfs: { filename: string; bytes: Uint8Array }[];
  errors: ValidationError[];
  mergedPdf?: Uint8Array;
  zipBytes?: Uint8Array;
}
