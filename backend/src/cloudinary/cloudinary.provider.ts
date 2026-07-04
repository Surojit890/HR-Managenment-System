import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export const CLOUDINARY = 'CLOUDINARY';

export const CloudinaryProvider: Provider = {
  provide: CLOUDINARY,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const url = config.get<string>('CLOUDINARY_URL');
    if (!url) {
      throw new Error('CLOUDINARY_URL is not set in environment variables');
    }
    cloudinary.config({ url });
    return cloudinary;
  },
};
