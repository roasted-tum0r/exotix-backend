import { Global, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ImageOwnerType } from "@prisma/client";
import { Images } from "../reviews/dto/review.dto";
@Global()
@Injectable()
export class UploadRepo {
    constructor(private readonly prisma: PrismaService) { }
    async addImages(refId: string, images: Images[], ownerType: ImageOwnerType) {
        if (!refId) {
            throw new Error("refId is required");
        }
        const ownerField = this.getOwnerField(ownerType);
        const data = images.map((image) => ({
            imageUrl: image.url,
            publicId: image.publicId,
            ownerType,
            [ownerField]: refId,
        }));

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