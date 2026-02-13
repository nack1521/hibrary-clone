import { IsString, Matches, MinLength } from "class-validator";

export class ChangePasswordDto {
    @IsString()
    oldPassword: string;

    @IsString()
    @MinLength(8)
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/)
    newPassword: string;
}
