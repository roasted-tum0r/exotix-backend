import {
  Controller,
  Post,
  Delete,
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
import { DeleteImagesDto } from './dto/delete-images.dto';
import { UploadRepo } from './upload.repo';

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
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly uploadRepo: UploadRepo,
  ) { }

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
   * DELETE /upload
   * Batch-delete files from both Cloudinary and the Image metadata table.
   *
   * Body: { publicIds: string[] }
   *
   * Each publicId is deleted from Cloudinary in parallel, then all rows
   * are purged from the Image table in a single query.
   * Returns a summary with counts and any publicIds that were not found
   * in Cloudinary (already gone / never uploaded).
   */
  @Delete()
  async deleteFiles(@Body() body: DeleteImagesDto) {
    const { publicIds } = body;

    try {
      // ── 1. Delete from Cloudinary (parallel, fail-fast) ────────────────
      const cloudinaryResults = await Promise.all(
        publicIds.map((id) => this.cloudinaryService.deleteImage(id)),
      );

      const notFoundInCloudinary = publicIds.filter(
        (_, i) => cloudinaryResults[i]?.result === 'not found',
      );
      const deletedFromCloudinary = publicIds.length - notFoundInCloudinary.length;

      // ── 2. Delete rows from the Image metadata table ───────────────────
      const { count: deletedFromDb } = await this.uploadRepo.deleteImages(publicIds);

      return {
        success: true,
        deletedFromCloudinary,
        deletedFromDb,
        notFoundInCloudinary,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: 'File deletion failed. Please try again.',
          detail: error?.message ?? 'Unknown error',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}