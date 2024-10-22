import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AwsS3Service } from './aws-s3.service';
import { AwsS3Config } from './config/aws-s3.config';

@Module({
  imports: [ConfigModule],
  providers: [AwsS3Service, AwsS3Config],
  exports: [AwsS3Service],
})
export class AwsS3Module {}