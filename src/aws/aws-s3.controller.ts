import {
  Controller,
  Post,
  Delete,
  Param,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AwsS3Service } from './aws-s3.service';
import { MultipartFile } from './interfaces/multipart-file.interface';

@Controller('files')
export class AwsS3Controller {
  private readonly logger = new Logger(AwsS3Controller.name);

  constructor(private readonly awsS3Service: AwsS3Service) {}

  @Post('upload/:entityType/:entityId')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      fileFilter: (req, file, callback) => {
        const allowedMimes = [
          'text/plain',
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('Unsupported file type'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB 제한
      },
    }),
  )
  async uploadFiles(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseIntPipe) entityId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    this.logger.log(`Received upload request for entityType: ${entityType}, entityId: ${entityId}`);

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const multipartFiles: MultipartFile[] = files.map((file) => ({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    }));

    return this.awsS3Service.uploadFiles(entityId, entityType, multipartFiles);
  }

  @Post('upload-single/:id')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadSingleFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const multipartFile: MultipartFile = {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };

    return this.awsS3Service.saveFile(id, multipartFile);
  }

  @Delete(':keyName')
  @HttpCode(HttpStatus.OK)
  async deleteFile(@Param('keyName') keyName: string) {
    await this.awsS3Service.deleteFile(keyName);
    return {
      statusCode: HttpStatus.OK,
      message: 'File successfully deleted',
    };
  }
}