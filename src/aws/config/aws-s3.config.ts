import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsS3Config {
  constructor(private readonly configService: ConfigService) {}

  public readonly credentials = {
    accessKeyId: this.configService.get<string>('secrets.AWS_ACCESS_KEY_ID'),
    secretAccessKey: this.configService.get<string>('secrets.AWS_SECRET_ACCESS_KEY'),
  };

  public readonly s3 = {
    bucketName: this.configService.get<string>('incorrect-notes/'),
    region: this.configService.get<string>('ap-northeast-2'),
  };
}