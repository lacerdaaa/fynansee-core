import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  document?: string;
}
