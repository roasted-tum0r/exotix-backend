import { Global, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ImageOwnerType } from "@prisma/client";
import { Images } from "../reviews/dto/review.dto";
import { CloudinaryService } from "src/config/cloudinary/cloudinary.service";
@Global()
@Injectable()
export class UploadRepo {
    constructor(private readonly prisma: PrismaService, private readonly cloudinaryService: CloudinaryService) { }
    async addImages(refId: string, images: Images[], ownerType: ImageOwnerType) {
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
            select: { publicId: true },
        });
    }
    private getOwnerField(ownerType: ImageOwnerType): string {
        switch (ownerType) {
            case ImageOwnerType.USER:
                return "userId";
            case ImageOwnerType.ITEM:
                return "itemId";
            case ImageOwnerType.BRANCH:
                return "branchId";
            case ImageOwnerType.REVIEW:
                return "reviewId";
            default:
                throw new Error("Invalid owner type");
        }
    }
}   