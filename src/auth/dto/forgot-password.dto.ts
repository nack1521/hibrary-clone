import { IsEmail, IsString, Matches, MinLength } from "class-validator";

export class ForgotPasswordDto {
    @IsEmail()
    email: string;
}