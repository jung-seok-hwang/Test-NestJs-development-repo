import { Controller, Post, Get, UploadedFile, UseInterceptors, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { message: 'No file uploaded' };
    }
    return this.appService.uploadFile(file);
  }

  @Get()
  getUploadPage(@Res() res: Response) {
    res.status(200).send(`
      <html>
        <body>
          <h2>File Upload</h2>
          <form action="/upload" method="post" enctype="multipart/form-data">
            <input type="file" name="file">
            <button type="submit">Upload</button>
          </form>
        </body>
      </html>
    `);
  }
}