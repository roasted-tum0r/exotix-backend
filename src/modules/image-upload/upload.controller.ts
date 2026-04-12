import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { CloudinaryService } from 'src/config/cloudinary/cloudinary.service';
import { UploadImageDto } from './dto/upload-image.dto';

/** Safe image & video mimetypes accepted for upload */
const ALLOWED_MIMETYPES = new Set([
  // ── Images ──────────────────────────────────────────────────────────
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/tiff',
  'image/bmp',
  'image/svg+xml',
  // ── Videos ──────────────────────────────────────────────────────────
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',   // .mov
  'video/x-msvideo',  // .avi
  'video/x-matroska', // .mkv
  'video/x-flv',
  'video/x-ms-wmv',
  'video/3gpp',
  'video/3gpp2',
  'video/mp2t',        // .ts
]);

@Controller('upload')
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   * POST /upload
   * Multipart form-data fields:
   *   - file      : the file binary (any image or video format)
   *   - ownerType : ImageOwnerType enum value (USER | ITEM | BRANCH | REVIEW)
   *
   * Returns the Cloudinary secure_url and public_id.
   * The file is stored under /<ownerType_lowercase>/ and tagged 'temp'.
   * After saving the related entity, call CloudinaryService.updateImageTag()
   * with the new entity's PK to replace the 'temp' tag.
   */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max — images + videos combined
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMETYPES.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Unsupported file type "${file.mimetype}". ` +
                'Only safe image and video formats are allowed.',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadImageDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const result = await this.cloudinaryService.uploadMedia(
        file.buffer,
        file.mimetype,
        body.ownerType,
      );

      return {
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: 'File upload failed. Please try again.',
          detail: error?.message ?? 'Unknown Cloudinary error',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}