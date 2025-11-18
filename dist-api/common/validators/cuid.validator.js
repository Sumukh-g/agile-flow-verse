"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsCuid = IsCuid;
exports.IsCuidArray = IsCuidArray;
const class_validator_1 = require("class-validator");
/**
 * Validates that a string is a valid CUID format
 * CUIDs are 25 characters long and start with 'c'
 */
function IsCuid(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isCuid',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value, args) {
                    if (typeof value !== 'string')
                        return false;
                    // CUID format: starts with 'c' and is 25 characters long
                    return /^c[a-z0-9]{24}$/.test(value);
                },
                defaultMessage(args) {
                    return `${args.property} must be a valid CUID`;
                },
            },
        });
    };
}
/**
 * Validates that each string in an array is a valid CUID
 */
function IsCuidArray(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isCuidArray',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value, args) {
                    if (!Array.isArray(value))
                        return false;
                    return value.every((item) => typeof item === 'string' && /^c[a-z0-9]{24}$/.test(item));
                },
                defaultMessage(args) {
                    return `${args.property} must be an array of valid CUIDs`;
                },
            },
        });
    };
}
