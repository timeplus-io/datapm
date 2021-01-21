import { ValidationError } from "apollo-server";
import { emailAddressValid } from "datapm-lib";
import { AuthenticatedContext, Context } from "../context";
import { UserEntity } from "../entity/UserEntity";
import { CatalogIdentifierInput, Permission, SetUserCatalogPermissionInput } from "../generated/graphql";
import { UserCatalogPermissionRepository } from "../repository/CatalogPermissionRepository";
import { CatalogRepository } from "../repository/CatalogRepository";
import { CollectionRepository } from "../repository/CollectionRepository";
import { UserRepository } from "../repository/UserRepository";
import { asyncForEach } from "../util/AsyncForEach";
import { sendInviteUser, validateMessageContents } from "../util/smtpUtil";

export const hasCatalogPermissions = async (context: Context, catalogId: number, permission: Permission) => {
    if (permission == Permission.VIEW) {
        const collection = await context.connection.getCustomRepository(CatalogRepository).findOne({ id: catalogId });

        if (collection?.isPublic) return true;
    }

    if (context.me == null) {
        return false;
    }

    return context.connection
        .getCustomRepository(UserCatalogPermissionRepository)
        .hasPermission(context.me.id, catalogId, permission);
};

export const deleteUserCatalogPermissions = async (
    _0: any,
    { identifier, username }: { identifier: CatalogIdentifierInput; username: string },
    context: AuthenticatedContext
) => {
    return context.connection.getCustomRepository(UserCatalogPermissionRepository).deleteUserCatalogPermissions({
        identifier,
        username
    });
};

export const setUserCatalogPermission = async (
    _0: any,
    {
        identifier,
        value,
        message
    }: { identifier: CatalogIdentifierInput; value: SetUserCatalogPermissionInput[]; message: string },
    context: AuthenticatedContext,
    info: any
) => {
    validateMessageContents(message);

    const catalogEntity = await context.connection
        .getCustomRepository(CatalogRepository)
        .findCatalogBySlugOrFail(identifier.catalogSlug);

    const inviteUsers: UserEntity[] = [];

    await context.connection
        .transaction(async (transaction) => {
            await asyncForEach(value, async (userCatalogPermission) => {
                let userId = null;
                const user = await transaction
                    .getCustomRepository(UserRepository)
                    .getUserByUsernameOrEmailAddress(userCatalogPermission.usernameOrEmailAddress);

                if (user == null) {
                    if (emailAddressValid(userCatalogPermission.usernameOrEmailAddress) === true) {
                        const inviteUser = await context.connection
                            .getCustomRepository(UserRepository)
                            .createInviteUser(userCatalogPermission.usernameOrEmailAddress);

                        userId = inviteUser.id;
                        inviteUsers.push(inviteUser);
                    } else {
                        throw new ValidationError("USER_NOT_FOUND - " + userCatalogPermission.usernameOrEmailAddress);
                    }
                } else {
                    userId = user.id;
                }

                await transaction.getCustomRepository(UserCatalogPermissionRepository).setUserCatalogPermission({
                    identifier,
                    value: userCatalogPermission
                });
            });
        })
        .then(async () => {
            await asyncForEach(inviteUsers, async (user) => {
                await sendInviteUser(user, context.me.displayName, catalogEntity.displayName, message);
            });
        });
};
