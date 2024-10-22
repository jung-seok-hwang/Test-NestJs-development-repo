import { FileInfo } from "./file-info.interface";

export interface S3File {
  id: number;
  s3Files: FileInfo[];
  entityId: number;
  entityType: string;
  createdAt: Date;
  updatedAt: Date;
}
