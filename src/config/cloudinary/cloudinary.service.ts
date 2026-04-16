import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ImageOwnerType } from '@prisma/client';
import * as sharp from 'sharp';

@Injectable()
export class CloudinaryService {
  /**
   * Upload any file (image or video) to Cloudinary.
   * - Images are compressed with sharp before upload (quality 75, progressive).
   * - Videos are uploaded with Cloudinary's auto quality transcoding.
   * - Placed in folder : /<ownerType_lowercase>/
   * - Tagged with      : ['temp'] — not yet linked to an entity.
   *
   * After the owning entity is saved, call updateImageTag() to replace
   * 'temp' with the entity's primary-key UUID.
   *
   * @param buffer    - File buffer from multer memory storage
   * @param mimetype  - MIME type of the uploaded file
   * @param ownerType - ImageOwnerType enum value (USER | ITEM | BRANCH | REVIEW)
   */
  async uploadMedia(
    buffer: Buffer,
    mimetype: string,
    ownerType: ImageOwnerType,
  ): Promise<{ secure_url: string; public_id: string }> {
    try {
      const folder = ownerType.toLowerCase(); // 'user' | 'item' | 'branch' | 'review'

      // ── Resource type detection ───────────────────────────────────────────
      // fileFilter in the controller guarantees only image/* or video/* arrives here
      let resource_type: 'image' | 'video';
      if (mimetype.startsWith('image/')) resource_type = 'image';
      else if (mimetype.startsWith('video/')) resource_type = 'video';
      else throw new Error(`Unsupported mimetype: ${mimetype}`);

      // ── Image compression via sharp ───────────────────────────────────────
      // SVG and GIF are passed through (sharp doesn't handle animated GIF or SVG well)
      let uploadBuffer = buffer;
      if (resource_type === 'image' && mimetype !== 'image/svg+xml' && mimetype !== 'image/gif') {
        uploadBuffer = await sharp(buffer)
          .rotate()                   // auto-rotate based on EXIF orientation
          .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
          .toFormat('webp', { quality: 75, effort: 6 })  // convert all raster images to WebP @ ~75%
          .toBuffer();
      }

      return new Promise((resolve, reject) => {
        const uploadOptions: Record<string, any> = {
          folder,
          tags: ['temp'],
          resource_type,
        };

        // ── Video: let Cloudinary auto-transcode for best compression ─────
        if (resource_type === 'video') {
          uploadOptions.eager = [
            { quality: 'auto', fetch_format: 'auto' },
          ];
          uploadOptions.eager_async = true; // don't block the upload response
        }

        const stream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error: any, result: any) => {
            if (error) return reject(new Error(error.message ?? String(error)));
            resolve({ secure_url: result.secure_url, public_id: result.public_id });
          },
        );

        stream.end(uploadBuffer);
      });
    } catch (error) {
      console.log(error);
      throw error;
    }

  }

  /**
   * Called after the owning entity's metadata is saved.
   * Replaces the 'temp' tag with the entity's primary key so the file
   * can be easily queried per owner in Cloudinary.
   *
   * @param publicId - Cloudinary public_id returned from uploadMedia()
   * @param ownerId  - Primary key (UUID) of the saved owner row
   */
  async updateImageTag(publicId: string, ownerId: string): Promise<void> {
    try {
      await cloudinary.uploader.replace_tag(ownerId, [publicId]);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /**
   * Permanently delete a file from Cloudinary by its public_id.
   */
  async deleteImage(publicId: string): Promise<any> {
    try {
      return cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}