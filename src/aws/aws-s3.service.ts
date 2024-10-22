import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { AwsS3Config } from './config/aws-s3.config';
import { MultipartFile } from './interfaces/multipart-file.interface';
import { FileInfo } from './interfaces/file-info.interface';
import { S3File } from './interfaces/s3-file.interface';

@Injectable()
export class AwsS3Service {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(AwsS3Service.name);

  constructor(private readonly config: AwsS3Config) {
    this.logger.log(`Initializing S3 client with bucket: ${this.config.s3.bucketName}`);

    this.s3Client = new S3Client({
      region: this.config.s3.region,
      credentials: {
        accessKeyId: this.config.credentials.accessKeyId,
        secretAccessKey: this.config.credentials.secretAccessKey,
      },
    });
  }

  async uploadFiles(entityId: number, entityType: string, files: MultipartFile[]): Promise<S3File> {
    const fileInfos = await Promise.all(
      files.map(async (file, index) => {
        const keyName = this.generateFileName(file.originalname);
        const uploadResult = await this.uploadToBucket(file, keyName);
        return this.createFileInfo(index + 1, keyName, uploadResult);
      }),
    );

    return {
      id: Date.now(),
      s3Files: fileInfos,
      entityId,
      entityType,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async saveFile(id: number, file: MultipartFile): Promise<string> {
    if (!file) {
      throw new BadRequestException('File not found');
    }

    const keyName = this.generateFileName(file.originalname);
    return this.uploadToBucket(file, keyName);
  }

  private async uploadToBucket(file: MultipartFile, keyName: string): Promise<string> {
    const fullKeyName = `incorrect-notes/${keyName}`;

    try {
      const params = {
        Bucket: this.config.s3.bucketName,
        Key: fullKeyName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);

      return `https://${this.config.s3.bucketName}.s3.${this.config.s3.region}.amazonaws.com/${fullKeyName}`;
    } catch (error) {
      this.logger.error(`[AwsS3Service.uploadToBucket] Failed to upload file: ${fullKeyName}`, error);
      throw error;
    }
  }

  async deleteFile(keyName: string): Promise<void> {
    const fullKeyName = `incorrect-notes/${keyName}`;
    const params = {
      Bucket: this.config.s3.bucketName,
      Key: fullKeyName,
    };

    try {
      await this.s3Client.send(new DeleteObjectCommand(params));
    } catch (error) {
      this.logger.error(`[AwsS3Service.deleteFile] Failed to delete file: ${fullKeyName}`, error);
      throw error;
    }
  }

  private generateFileName(originalFileName: string): string {
    const uniqueFileName = `${uuidv4()}_${this.sanitizeFileName(originalFileName)}`;
    return uniqueFileName;
  }

  private sanitizeFileName(fileName: string): string {
    return Buffer.from(fileName, 'latin1')
      .toString('utf8')
      .replace(/[^a-zA-Z0-9가-힣._-]/g, '')
      .replace(/\s+/g, '_');
  }

  private createFileInfo(seq: number, keyName: string, path: string): FileInfo {
    return {
      seq,
      keyName,
      path,
    };
  }
}
