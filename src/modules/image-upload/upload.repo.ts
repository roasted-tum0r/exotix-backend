import { Global, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ImageOwnerType } from "@prisma/client";
import { ImagesDto } from "../reviews/dto/review.dto";
import { CloudinaryService } from "src/config/cloudinary/cloudinary.service";
@Global()
@Injectable()
export class UploadRepo {
    constructor(private readonly prisma: PrismaService, private readonly cloudinaryService: CloudinaryService) { }
    async addImages(refId: string, images: ImagesDto[], ownerType: ImageOwnerType) {
        if (!refId) {
            throw new Error("refId is required");
        }
        const ownerField = this.getOwnerField(ownerType);
        const data = images.map((image) => {
            this.cloudinaryService.updateImageTag(image.publicId, refId);
            return {
                imageUrl: image.url,
                publicId: image.publicId,
                ownerType,
                [ownerField]: refId,
            }
        });

        return this.prisma.image.createMany({ data });
    }
    async deleteImages(publicIds: string[]) {
        return await this.prisma.image.deleteMany({
            where: {
                publicId: {
                    in: publicIds,
                },
            },
        });
    }

    /** Returns the publicId list for all images linked to a review. */
    async getImagesById(refId: string, ownerType: ImageOwnerType): Promise<{ publicId: string }[]> {
        if (!refId) {
            throw new Error("refId is required");
        }
        const ownerField = this.getOwnerField(ownerType);
        return this.prisma.image.findMany({
            where: { [ownerField]: refId },
            select: { publicId: true, imageUrl: true },
        });
    }

    /**
     * Convenience method used by hard-delete flows.
     * Fetches all images for the given ref + ownerTypes, removes them from
     * Cloudinary, then deletes the DB records — all in one call.
     */
    async purgeImagesByRef(refId: string, ownerTypes: ImageOwnerType[]): Promise<void> {
        if (!refId) return;

        // Collect publicIds across every ownerType in parallel
        const imageSets = await Promise.all(
            ownerTypes.map((ownerType) => this.getImagesById(refId, ownerType)),
        );
        const allImages = imageSets.flat();
        if (!allImages.length) return;

        const publicIds = allImages.map((img) => img.publicId);

        // Delete from Cloudinary (fire-and-forget failures — don't block DB cleanup)
        await Promise.allSettled(
            publicIds.map((pid) => this.cloudinaryService.deleteImage(pid)),
        );

        // Remove DB records
        await this.deleteImages(publicIds);
    }

    private getOwnerField(ownerType: ImageOwnerType): string {
        switch (ownerType) {
            case ImageOwnerType.USER:
                return "userId";
            case ImageOwnerType.ITEM_THUMBNAIL:
            case ImageOwnerType.ITEM_GALLERY:
                return "itemId";
            case ImageOwnerType.BRANCH:
                return "branchId";
            case ImageOwnerType.REVIEW:
                return "reviewId";
            case ImageOwnerType.CATEGORY_BANNER:
            case ImageOwnerType.CATEGORY_IMAGE:
                return "categoryId";
            default:
                throw new Error("Invalid owner type");
        }
    }
}   