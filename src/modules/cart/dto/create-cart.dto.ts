import { IsNotEmpty } from "class-validator";

export class CreateCartDto {
    @IsNotEmpty()
    itemIds:number[]
}
