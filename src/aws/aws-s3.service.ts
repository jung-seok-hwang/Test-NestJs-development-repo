import { Injectable, Logger } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { ManagedUpload } from 'aws-sdk/clients/s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { AwsS3Config } from './config/aws-s3.config';
import { MultipartFile } from './interfaces/multipart-file.interface';
import { FileInfo } from './interfaces/file-info.interface';
import { S3File } from './interfaces/s3-file.interface';

@Injectable()
export class AwsS3Service {
  private readonly s3: S3;
  private readonly logger = new Logger(AwsS3Service.name);

  constructor(private readonly config: AwsS3Config) {
    this.s3 = new S3({
      credentials: {
        accessKeyId: this.config.credentials.accessKeyId,
        secretAccessKey: this.config.credentials.secretAccessKey,
      },
      region: this.config.s3.region,
    });
  }

  async uploadFiles(entityId: number, entityType: string, files: MultipartFile[]): Promise<S3File> {
    const fileInfos: FileInfo[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const keyName = this.generateFileName(entityType, entityId, file.originalname);
      const uploadResult = await this.uploadToBucket(file, keyName);
      fileInfos.push(this.createFileInfo(i + 1, keyName, uploadResult.Location));
    }

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
      throw new Error('File not found');
    }

    const keyName = this.generateFileName('notice', id, file.originalname);
    const uploadResult = await this.uploadToBucket(file, keyName);
    return uploadResult.Location;
  }

  async updateFile(
    entityId: number,
    entityType: string,
    seq: number,
    file: MultipartFile,
  ): Promise<FileInfo> {
    const keyName = this.generateFileName(entityType, entityId, file.originalname);
    const uploadResult = await this.uploadToBucket(file, keyName);
    return this.createFileInfo(seq, keyName, uploadResult.Location);
  }

  async deleteFile(keyName: string): Promise<void> {
    const params: S3.DeleteObjectRequest = {
      Bucket: this.config.s3.bucketName,
      Key: keyName,
    };

    try {
      await this.s3.deleteObject(params).promise();
    } catch (error) {
      this.logger.error(`[AwsS3Service.deleteFile] Failed to delete file: ${keyName}`, error);
      throw error;
    }
  }

  private async uploadToBucket(
    file: MultipartFile,
    keyName: string,
  ): Promise<ManagedUpload.SendData> {
    const params: S3.PutObjectRequest = {
      Bucket: this.config.s3.bucketName,
      Key: keyName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    try {
      return await this.s3.upload(params).promise();
    } catch (error) {
      this.logger.error(`[AwsS3Service.uploadToBucket] Failed to upload file: ${keyName}`, error);
      throw error;
    }
  }

  private generateFileName(
    entityType: string,
    entityId: number,
    originalFileName: string,
  ): string {
    const folderName = this.createFolderNameWithTodayDate();
    const uniqueFileName = `${entityType}/${entityId}/${uuidv4()}_${originalFileName}`;
    return path.join(folderName, uniqueFileName);
  }

  private createFolderNameWithTodayDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}/${month}`;
  }

  private createFileInfo(seq: number, keyName: string, path: string): FileInfo {
    return {
      seq,
      keyName,
      path,
    };
  }
}
