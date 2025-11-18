"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShareFormDto = exports.SubmitFormResponseDto = exports.UpdateFormDto = exports.CreateFormDto = exports.FormSettingsDto = exports.FormFieldDto = exports.FormAccess = exports.FormType = exports.FormStatus = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const cuid_validator_1 = require("../common/validators/cuid.validator");
var FormStatus;
(function (FormStatus) {
    FormStatus["Draft"] = "draft";
    FormStatus["Active"] = "active";
    FormStatus["Closed"] = "closed";
    FormStatus["Archived"] = "archived";
})(FormStatus || (exports.FormStatus = FormStatus = {}));
var FormType;
(function (FormType) {
    FormType["Survey"] = "survey";
    FormType["Feedback"] = "feedback";
    FormType["BugReport"] = "bug-report";
    FormType["Requirements"] = "requirements";
    FormType["Review"] = "review";
    FormType["Application"] = "application";
})(FormType || (exports.FormType = FormType = {}));
var FormAccess;
(function (FormAccess) {
    FormAccess["View"] = "view";
    FormAccess["Respond"] = "respond";
    FormAccess["Edit"] = "edit";
})(FormAccess || (exports.FormAccess = FormAccess = {}));
class FormFieldDto {
}
exports.FormFieldDto = FormFieldDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Field ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FormFieldDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Field type', enum: ['text', 'email', 'phone', 'number', 'textarea', 'select', 'checkbox', 'radio', 'date', 'rating', 'scale', 'file'] }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FormFieldDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Minimum value for scale/rating' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], FormFieldDto.prototype, "min", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Maximum value for scale/rating' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], FormFieldDto.prototype, "max", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Step value for scale' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], FormFieldDto.prototype, "step", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Field label' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], FormFieldDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Field placeholder' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], FormFieldDto.prototype, "placeholder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Is field required' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FormFieldDto.prototype, "required", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Options for select/radio fields', type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], FormFieldDto.prototype, "options", void 0);
class FormSettingsDto {
}
exports.FormSettingsDto = FormSettingsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Allow anonymous responses' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FormSettingsDto.prototype, "allowAnonymous", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Require login to respond' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FormSettingsDto.prototype, "requireLogin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Send confirmation email' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FormSettingsDto.prototype, "sendConfirmation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Limit number of responses' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FormSettingsDto.prototype, "limitResponses", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Maximum number of responses' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], FormSettingsDto.prototype, "maxResponses", void 0);
class CreateFormDto {
}
exports.CreateFormDto = CreateFormDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Form title', example: 'User Feedback Survey' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateFormDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Form description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateFormDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Form fields', type: [FormFieldDto] }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateFormDto.prototype, "fields", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Form status', enum: FormStatus, default: FormStatus.Draft }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(FormStatus),
    __metadata("design:type", String)
], CreateFormDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Form type', enum: FormType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(FormType),
    __metadata("design:type", String)
], CreateFormDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Form settings', type: FormSettingsDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => FormSettingsDto),
    __metadata("design:type", FormSettingsDto)
], CreateFormDto.prototype, "settings", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Is form public' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateFormDto.prototype, "isPublic", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Project ID (optional)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, cuid_validator_1.IsCuid)(),
    __metadata("design:type", String)
], CreateFormDto.prototype, "projectId", void 0);
class UpdateFormDto {
}
exports.UpdateFormDto = UpdateFormDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Form title' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateFormDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Form description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdateFormDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Form fields', type: [FormFieldDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], UpdateFormDto.prototype, "fields", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Form status', enum: FormStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(FormStatus),
    __metadata("design:type", String)
], UpdateFormDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Form type', enum: FormType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(FormType),
    __metadata("design:type", String)
], UpdateFormDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Form settings', type: FormSettingsDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => FormSettingsDto),
    __metadata("design:type", FormSettingsDto)
], UpdateFormDto.prototype, "settings", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Is form public' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateFormDto.prototype, "isPublic", void 0);
class SubmitFormResponseDto {
}
exports.SubmitFormResponseDto = SubmitFormResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Response data as JSON object', example: { 'field1': 'value1', 'field2': 'value2' } }),
    (0, class_validator_1.IsJSON)(),
    __metadata("design:type", Object)
], SubmitFormResponseDto.prototype, "data", void 0);
class ShareFormDto {
}
exports.ShareFormDto = ShareFormDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User ID to share with (null for public share)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, cuid_validator_1.IsCuid)(),
    __metadata("design:type", String)
], ShareFormDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Access level', enum: FormAccess, default: FormAccess.Respond }),
    (0, class_validator_1.IsEnum)(FormAccess),
    __metadata("design:type", String)
], ShareFormDto.prototype, "access", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Expiration date (ISO string)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShareFormDto.prototype, "expiresAt", void 0);
