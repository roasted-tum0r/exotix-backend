import { Module } from "@nestjs/common";
import { UploadController } from "./upload.controller";
import { CloudinaryProvider } from "src/config/cloudinary/cloudinary.provider";
import { CloudinaryService } from "src/config/cloudinary/cloudinary.service";

@Module({
  controllers: [UploadController],
  providers: [CloudinaryProvider, CloudinaryService],
  exports: [CloudinaryProvider, CloudinaryService],
})
export class UploadModule {}