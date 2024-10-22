export interface MultipartFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}