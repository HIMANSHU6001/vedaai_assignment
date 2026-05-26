import { Readable } from 'stream';
import cloudinary from '../config/cloudinary';

export async function uploadToCloudinary(
  buffer: Buffer,
  originalname: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'vedaai-assignments',
        use_filename: true,
        unique_filename: true,
        filename_override: originalname,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }

        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}
