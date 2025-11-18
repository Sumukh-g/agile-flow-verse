import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsJSON, IsNumber, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsCuid } from '../common/validators/cuid.validator';

export enum FormStatus {
  Draft = 'draft',
  Active = 'active',
  Closed = 'closed',
  Archived = 'archived',
}

export enum FormType {
  Survey = 'survey',
  Feedback = 'feedback',
  BugReport = 'bug-report',
  Requirements = 'requirements',
  Review = 'review',
  Application = 'application',
}

export enum FormAccess {
  View = 'view',
  Respond = 'respond',
  Edit = 'edit',
}

export class FormFieldDto {
  @ApiProperty({ description: 'Field ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Field type', enum: ['text', 'email', 'phone', 'number', 'textarea', 'select', 'checkbox', 'radio', 'date', 'rating', 'scale', 'file'] })
  @IsString()
  type!: string;

  @ApiPropertyOptional({ description: 'Minimum value for scale/rating' })
  @IsOptional()
  @IsNumber()
  min?: number;

  @ApiPropertyOptional({ description: 'Maximum value for scale/rating' })
  @IsOptional()
  @IsNumber()
  max?: number;

  @ApiPropertyOptional({ description: 'Step value for scale' })
  @IsOptional()
  @IsNumber()
  step?: number;

  @ApiProperty({ description: 'Field label' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label!: string;

  @ApiPropertyOptional({ description: 'Field placeholder' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  placeholder?: string;

  @ApiProperty({ description: 'Is field required' })
  @IsBoolean()
  required!: boolean;

  @ApiPropertyOptional({ description: 'Options for select/radio fields', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}

export class FormSettingsDto {
  @ApiPropertyOptional({ description: 'Allow anonymous responses' })
  @IsOptional()
  @IsBoolean()
  allowAnonymous?: boolean;

  @ApiPropertyOptional({ description: 'Require login to respond' })
  @IsOptional()
  @IsBoolean()
  requireLogin?: boolean;

  @ApiPropertyOptional({ description: 'Send confirmation email' })
  @IsOptional()
  @IsBoolean()
  sendConfirmation?: boolean;

  @ApiPropertyOptional({ description: 'Limit number of responses' })
  @IsOptional()
  @IsBoolean()
  limitResponses?: boolean;

  @ApiPropertyOptional({ description: 'Maximum number of responses' })
  @IsOptional()
  @IsNumber()
  maxResponses?: number;
}

export class CreateFormDto {
  @ApiProperty({ description: 'Form title', example: 'User Feedback Survey' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ description: 'Form description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'Form fields', type: [FormFieldDto] })
  @IsArray()
  fields!: FormFieldDto[];

  @ApiPropertyOptional({ description: 'Form status', enum: FormStatus, default: FormStatus.Draft })
  @IsOptional()
  @IsEnum(FormStatus)
  status?: FormStatus;

  @ApiPropertyOptional({ description: 'Form type', enum: FormType })
  @IsOptional()
  @IsEnum(FormType)
  type?: FormType;

  @ApiPropertyOptional({ description: 'Form settings', type: FormSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FormSettingsDto)
  settings?: FormSettingsDto;

  @ApiPropertyOptional({ description: 'Is form public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Project ID (optional)' })
  @IsOptional()
  @IsString()
  @IsCuid()
  projectId?: string;
}

export class UpdateFormDto {
  @ApiPropertyOptional({ description: 'Form title' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Form description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Form fields', type: [FormFieldDto] })
  @IsOptional()
  @IsArray()
  fields?: FormFieldDto[];

  @ApiPropertyOptional({ description: 'Form status', enum: FormStatus })
  @IsOptional()
  @IsEnum(FormStatus)
  status?: FormStatus;

  @ApiPropertyOptional({ description: 'Form type', enum: FormType })
  @IsOptional()
  @IsEnum(FormType)
  type?: FormType;

  @ApiPropertyOptional({ description: 'Form settings', type: FormSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FormSettingsDto)
  settings?: FormSettingsDto;

  @ApiPropertyOptional({ description: 'Is form public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class SubmitFormResponseDto {
  @ApiProperty({ description: 'Response data as JSON object', example: { 'field1': 'value1', 'field2': 'value2' } })
  @IsJSON()
  data!: any;
}

export class ShareFormDto {
  @ApiPropertyOptional({ description: 'User ID to share with (null for public share)' })
  @IsOptional()
  @IsString()
  @IsCuid()
  userId?: string;

  @ApiProperty({ description: 'Access level', enum: FormAccess, default: FormAccess.Respond })
  @IsEnum(FormAccess)
  access!: FormAccess;

  @ApiPropertyOptional({ description: 'Expiration date (ISO string)' })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}

