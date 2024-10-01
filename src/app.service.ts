import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  private s3: S3Client;

  constructor(private configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadFile(file: Express.Multer.File) {
    try {
      const params = {
        Bucket: this.configService.get<string>('AWS_BUCKET_NAME'),
        Key: `uploads/${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      const command = new PutObjectCommand(params);
      const response = await this.s3.send(command);
      return {
        ETag: response.ETag,
        Location: `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`,
        Key: params.Key,
        Bucket: params.Bucket,
      };
    } catch (error) {
      throw new InternalServerErrorException('파일 업로드 중 오류가 발생했습니다.');
    }
  }
}