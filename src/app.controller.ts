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