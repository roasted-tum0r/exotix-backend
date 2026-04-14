import { Global, Module } from "@nestjs/common";
import { UploadController } from "./upload.controller";
import { CloudinaryProvider } from "src/config/cloudinary/cloudinary.provider";
import { CloudinaryService } from "src/config/cloudinary/cloudinary.service";
import { UploadRepo } from "./upload.repo";
@Global()
@Module({
  controllers: [UploadController],
  providers: [CloudinaryProvider, CloudinaryService, UploadRepo],
  exports: [CloudinaryProvider, CloudinaryService, UploadRepo],
})
export class UploadModule {}