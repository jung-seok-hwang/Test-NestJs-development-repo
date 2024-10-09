// import { Controller, Post, Get, UploadedFile, UseInterceptors, Res } from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { Response } from 'express';
// import { AppService } from './app.service';

// @Controller()
// export class AppController {
//   constructor(private readonly appService: AppService) {}

//   @Post()
//   @UseInterceptors(FileInterceptor('file'))
//   async uploadFile(@UploadedFile() file: Express.Multer.File) {
//     if (!file) {
//       return { message: 'No file uploaded' };
//     }
//     return this.appService.uploadFile(file);
//   }

//   @Get()
//   getUploadPage(@Res() res: Response) {
//     res.status(200).send(`
//       <html>
//         <body>
//           <h2>File Upload</h2>
//           <form action="/upload" method="post" enctype="multipart/form-data">
//             <input type="file" name="file">
//             <button type="submit">Upload</button>
//           </form>
//         </body>
//       </html>
//     `);
//   }
// }

import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

@Controller()
export class AppController {
  @Get()
  serveClient(@Res() res: Response) {
    try {
      const clientHtml = readFileSync(join(__dirname, '..', 'client', 'index.html'), 'utf8');
      res.type('text/html').send(clientHtml);
    } catch (error) {
      console.error('Error reading index.html:', error);
      res.status(500).send('Error loading chat client');
    }
  }
}