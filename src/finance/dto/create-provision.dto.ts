import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { MovementType } from '../enums/movement-type.enum';

export class CreateProvisionDto {
  @IsEnum(MovementType)
  type: MovementType;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsDateString()
  dueOn: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
