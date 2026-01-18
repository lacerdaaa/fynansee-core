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

export class CreateEntryDto {
  @IsEnum(MovementType)
  type: MovementType;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsDateString()
  occurredOn: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
