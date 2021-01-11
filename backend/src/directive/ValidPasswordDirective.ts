import { SchemaDirectiveVisitor, ApolloError, ValidationError } from "apollo-server";
import { Kind } from "graphql";
import {
    GraphQLField,
    defaultFieldResolver,
    GraphQLInputField,
    GraphQLInputObjectType,
    GraphQLArgument,
    GraphQLInterfaceType,
    GraphQLObjectType,
    GraphQLNonNull,
    GraphQLScalarType
} from "graphql";
import { Context } from "../context";
import { INVALID_PASSWORD_ERROR } from "../generated/graphql";
import { ValidationConstraint } from "./ValidationConstraint";
import { ValidationType } from "./ValidationType";
import { passwordValid } from "datapm-lib";

export class ValidPasswordDirective extends SchemaDirectiveVisitor {
    visitArgumentDefinition(
        argument: GraphQLArgument,
        details: {
            field: GraphQLField<any, any>;
            objectType: GraphQLObjectType | GraphQLInterfaceType;
        }
    ): GraphQLArgument | void | null {
        const { resolve = defaultFieldResolver } = details.field;
        const self = this;
        details.field.resolve = function (source, args, context: Context, info) {
            const password: string | undefined = args.password || args.value.password || undefined;
            validatePassword(password);
            return resolve.apply(this, [source, args, context, info]);
        };
    }

    visitFieldDefinition(field: GraphQLField<any, any>) {
        const { resolve = defaultFieldResolver } = field;
        field.resolve = function (source, args, context: Context, info) {
            const password: string | undefined = args.password || args.value.password || undefined;

            validatePassword(args.password);

            return resolve.apply(this, [source, args, context, info]);
        };
    }

    visitInputFieldDefinition(
        field: GraphQLInputField,
        details: {
            objectType: GraphQLInputObjectType;
        }
    ): GraphQLInputField | void | null {
        field.type = ValidationType.create(field.type, new PasswordConstraint());
    }
}

export function validatePassword(password: string | undefined): void {
    const passwordValidResponse = passwordValid(password);

    if (passwordValidResponse === "PASSWORD_REQUIRED") {
        throw new ValidationError(INVALID_PASSWORD_ERROR.PASSWORD_REQUIRED);
    }
    if (passwordValidResponse === "PASSWORD_TOO_LONG") {
        throw new ValidationError(INVALID_PASSWORD_ERROR.PASSWORD_TOO_LONG);
    }

    if (passwordValidResponse === "PASSWORD_TOO_SHORT") {
        throw new ValidationError(INVALID_PASSWORD_ERROR.PASSWORD_TOO_SHORT);
    }

    if (passwordValidResponse === "INVALID_CHARACTERS") {
        throw new ValidationError(INVALID_PASSWORD_ERROR.INVALID_CHARACTERS);
    }
}
export class PasswordConstraint implements ValidationConstraint {
    getName(): string {
        return "Password";
    }

    validate(value: string) {
        validatePassword(value);
    }

    getCompatibleScalarKinds(): string[] {
        return [Kind.STRING];
    }
}
