import { IsString, IsNotEmpty, IsOptional, IsUrl } from "class-validator";

export class CreateItemCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  name: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Image must be a valid URL' })
  image?: string;
}
