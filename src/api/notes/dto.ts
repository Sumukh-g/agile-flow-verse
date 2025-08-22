import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsJSON, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(300)
  title!: string;

  @ApiProperty({ description: 'Rich text JSON' }) @IsJSON()
  content!: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  parentId?: string;

  @ApiProperty() @IsString()
  projectId!: string;

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray()
  tags?: string[];
}

export class UpdateNoteDto extends CreateNoteDto {} 