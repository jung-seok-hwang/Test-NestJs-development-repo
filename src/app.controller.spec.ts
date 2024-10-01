import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              // Mock 환경 변수 값들
              const envs = {
                AWS_REGION: 'us-east-1',
                AWS_ACCESS_KEY_ID: 'mock-access-key',
                AWS_SECRET_ACCESS_KEY: 'mock-secret-key',
                AWS_BUCKET_NAME: 'mock-bucket',
              };
              return envs[key];
            }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('uploadFile', () => {
    it('should upload a file', async () => {
      const mockFile = {
        originalname: 'test-file.txt',
        mimetype: 'text/plain',
        buffer: Buffer.from('test content'),
      } as Express.Multer.File;

      jest.spyOn(appService, 'uploadFile').mockResolvedValue({
        ETag: '"mock-etag"',
        Location: 'https://mock-bucket.s3.amazonaws.com/uploads/test-file.txt',
        Key: 'uploads/test-file.txt',
        Bucket: 'mock-bucket',
      });

      const result = await appController.uploadFile(mockFile);

      expect(result).toEqual({
        ETag: '"mock-etag"',
        Location: 'https://mock-bucket.s3.amazonaws.com/uploads/test-file.txt',
        Key: 'uploads/test-file.txt',
        Bucket: 'mock-bucket',
      });
      expect(appService.uploadFile).toHaveBeenCalledWith(mockFile);
    });
  });
});