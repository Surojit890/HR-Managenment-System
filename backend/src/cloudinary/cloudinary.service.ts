import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { UploadApiResponse, v2 as Cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private readonly cloudinary: typeof Cloudinary) {}

  async uploadImage(
    file: Express.Multer.File,
    folder = 'hrms/avatars',
  ): Promise<UploadApiResponse> {
    if (!file.buffer) {
      throw new BadRequestException('File buffer is empty');
    }

    return new Promise<UploadApiResponse>((resolve, reject) => {
      this.cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: 'image',
            transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        )
        .end(file.buffer);
    });
  }
}
