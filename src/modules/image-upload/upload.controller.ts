import {
  Controller,
  Post,
  Delete,
  Param,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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

/** Maximum number of files allowed in one request */
const MAX_FILES = 10;

@Controller('upload')
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   * POST /upload
   * Multipart form-data fields:
   *   - files[]   : 1–10 file binaries (any image or video format)
   *   - ownerType : ImageOwnerType enum value (USER | ITEM | BRANCH | REVIEW)
   *
   * Returns an array of { url, public_id } — one entry per uploaded file.
   * Each file is stored under /<ownerType_lowercase>/ and tagged 'temp'.
   * After saving the related entity, call CloudinaryService.updateImageTag()
   * with the new entity's PK to replace the 'temp' tag.
   */
  @Post()
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES, {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 20 * 1024 * 1024,   // 20 MB per file
        files: MAX_FILES,              // hard cap enforced by multer as well
      },
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
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadImageDto,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded. Send at least one file in the "files" field.');
    }

    try {
      // Upload all files in parallel — fail fast on any single error
      const results = await Promise.all(
        files.map((file) =>
          this.cloudinaryService.uploadMedia(
            file.buffer,
            file.mimetype,
            body.ownerType,
          ),
        ),
      );

      return {
        success: true,
        count: results.length,
        files: results.map((r) => ({
          url: r.secure_url,
          public_id: r.public_id,
        })),
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

  /**
   * DELETE /upload/:publicId
   * Permanently removes a file from Cloudinary.
   * Pass the public_id exactly as returned by the upload endpoint.
   * Note: forward-slashes in public_id must be URL-encoded (%2F).
   *
   * Example: DELETE /upload/review%2Fxkd92pqm7abc
   */
  @Delete(':publicId')
  async deleteFile(@Param('publicId') publicId: string) {
    try {
      const result = await this.cloudinaryService.deleteImage(publicId);

      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new Error(`Cloudinary responded with: ${result.result}`);
      }

      return {
        success: true,
        message:
          result.result === 'not found'
            ? 'File not found in Cloudinary — may have already been deleted.'
            : 'File deleted successfully.',
        public_id: publicId,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: 'File deletion failed. Please try again.',
          detail: error?.message ?? 'Unknown Cloudinary error',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}