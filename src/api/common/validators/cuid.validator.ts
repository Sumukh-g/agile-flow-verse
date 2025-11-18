import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Validates that a string is a valid CUID format
 * CUIDs are 25 characters long and start with 'c'
 */
export function IsCuid(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isCuid',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // CUID format: starts with 'c' and is 25 characters long
          return /^c[a-z0-9]{24}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid CUID`;
        },
      },
    });
  };
}

/**
 * Validates that each string in an array is a valid CUID
 */
export function IsCuidArray(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isCuidArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!Array.isArray(value)) return false;
          return value.every((item) => typeof item === 'string' && /^c[a-z0-9]{24}$/.test(item));
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be an array of valid CUIDs`;
        },
      },
    });
  };
}

