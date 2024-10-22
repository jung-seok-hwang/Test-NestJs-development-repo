import {
  Controller,
  Post,
  Delete,
  Param,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AwsS3Service } from './aws-s3.service';
import { MultipartFile } from './interfaces/multipart-file.interface';

@Controller('files')
export class AwsS3Controller {
  constructor(private readonly awsS3Service: AwsS3Service) {}

  @Post('upload/:entityType/:entityId')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseIntPipe) entityId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.awsS3Service.uploadFiles(
      entityId,
      entityType,
      files as unknown as MultipartFile[],
    );
  }

  @Post('upload-single/:id')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingleFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.awsS3Service.saveFile(id, file as unknown as MultipartFile);
  }

  @Delete(':keyName')
  async deleteFile(@Param('keyName') keyName: string) {
    await this.awsS3Service.deleteFile(keyName);
    return { message: 'File successfully deleted' };
  }
}