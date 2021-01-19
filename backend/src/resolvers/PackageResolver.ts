import { ApolloError, ForbiddenError, UserInputError } from "apollo-server";
import graphqlFields from "graphql-fields";
import { AuthenticatedContext, Context } from "../context";
import { PackageEntity } from "../entity/PackageEntity";
import { createActivityLog } from "../repository/ActivityLogRepository";
import {
    Base64ImageUpload,
    Catalog,
    CatalogIdentifierInput,
    Collection,
    CreatePackageInput,
    Package,
    PackageIdentifier,
    PackageIdentifierInput,
    Permission,
    UpdatePackageInput,
    Version,
    VersionIdentifierInput,
    ActivityLogEventType,
    ActivityLogChangeType
} from "../generated/graphql";
import { CatalogEntity } from "../entity/CatalogEntity";
import { UserCatalogPermissionRepository } from "../repository/CatalogPermissionRepository";
import { PackagePermissionRepository } from "../repository/PackagePermissionRepository";
import { PackageRepository } from "../repository/PackageRepository";
import { UserRepository } from "../repository/UserRepository";
import { getEnvVariable } from "../util/getEnvVariable";
import { getGraphQlRelationName, getRelationNames } from "../util/relationNames";
import { ImageStorageService } from "../storage/images/image-storage-service";
import { VersionRepository } from "../repository/VersionRepository";
import { hasCollectionPermissions } from "./UserCollectionPermissionResolver";
import { CatalogRepository } from "../repository/CatalogRepository";
import { resolvePackagePermissions } from "../directive/hasPackagePermissionDirective";
import { hasPackagePermissions } from "./UserPackagePermissionResolver";
import { Connection, EntityManager } from "typeorm";
import { versionEntityToGraphqlObject } from "./VersionResolver";
import { catalogEntityToGraphQL } from "./CatalogResolver";
import { CollectionRepository } from "../repository/CollectionRepository";
import { VersionEntity } from "../entity/VersionEntity";
import { emailAddressValid } from "datapm-lib";
import { sendInviteUser } from "../util/smtpUtil";

export const packageEntityToGraphqlObject = async (
    context: EntityManager | Connection,
    packageEntity: PackageEntity
): Promise<Package> => {
    if (packageEntity.catalog != null) {
        return {
            identifier: {
                registryURL: process.env["REGISTRY_URL"]!,
                catalogSlug: packageEntity.catalog.slug,
                packageSlug: packageEntity.slug
            }
        };
    }

    const packageEntityLoaded = await context
        .getRepository(PackageEntity)
        .findOneOrFail({ where: { id: packageEntity.id } });

    return {
        identifier: {
            registryURL: process.env["REGISTRY_URL"]!,
            catalogSlug: packageEntityLoaded.catalog.slug,
            packageSlug: packageEntityLoaded.slug
        }
    };
};

export const usersByPackage = async (
    _0: any,
    { identifier }: { identifier: PackageIdentifierInput },
    context: AuthenticatedContext,
    info: any
) => {
    const relations = getGraphQlRelationName(info);

    const packageEntity = await context.connection.manager
        .getCustomRepository(PackageRepository)
        .findPackageOrFail({ identifier });

    return await context.connection.manager
        .getCustomRepository(PackagePermissionRepository)
        .usersByPackage(packageEntity, relations);
};

export const myPackages = async (
    _0: any,
    { limit, offset }: { limit: number; offset: number },
    context: AuthenticatedContext,
    info: any
) => {
    const relations = getGraphQlRelationName(info);
    const [searchResponse, count] = await context.connection.manager
        .getCustomRepository(PackageRepository)
        .myPackages(context.me, limit, offset, relations);

    return {
        hasMore: count - (offset + limit) > 0,
        packages: await Promise.all(searchResponse.map((p) => packageEntityToGraphqlObject(context.connection, p))),
        count
    };
};

export const getLatestPackages = async (
    _0: any,
    { limit, offSet }: { limit: number; offSet: number },
    context: AuthenticatedContext,
    info: any
) => {
    const relations = getGraphQlRelationName(info);
    const [searchResponse, count] = await context.connection.manager
        .getCustomRepository(PackageRepository)
        .getLatestPackages(context.me, limit, offSet, relations);

    return {
        hasMore: count - (offSet + limit) > 0,
        packages: await Promise.all(searchResponse.map((p) => packageEntityToGraphqlObject(context.connection, p))),
        count
    };
};

export const packageVersions = async (parent: Package, _1: any, context: AuthenticatedContext, info: any) => {
    const packageEntity = await context.connection
        .getCustomRepository(PackageRepository)
        .findPackageOrFail({ identifier: parent.identifier });

    const versions = await context.connection
        .getCustomRepository(VersionRepository)
        .findVersions({ packageId: packageEntity.id, relations: getRelationNames(graphqlFields(info)) });

    return versions.map(async (v) => await versionEntityToGraphqlObject(context.connection, v));
};

export const packageCatalog = async (
    parent: Package,
    _1: any,
    context: AuthenticatedContext,
    info: any
): Promise<Catalog> => {
    const packageEntity = await context.connection
        .getCustomRepository(PackageRepository)
        .findPackageOrFail({ identifier: parent.identifier });

    const catalog = await context.connection.getCustomRepository(CatalogRepository).findOne(packageEntity.catalogId, {
        relations: getRelationNames(graphqlFields(info))
    });

    if (!catalog) throw new Error("CATALOG_NOT_FOUND");

    if (!(await hasPackagePermissions(context, packageEntity.id, Permission.VIEW))) {
        return {
            identifier: {
                catalogSlug: catalog.slug,
                registryURL: process.env["REGISTRY_URL"]
            }
        };
    }

    return catalogEntityToGraphQL(catalog);
};

export const packageLatestVersion = async (
    parent: Package,
    _1: any,
    context: AuthenticatedContext,
    info: any
): Promise<Version | null> => {
    const packageEntity = await context.connection
        .getCustomRepository(PackageRepository)
        .findPackageOrFail({ identifier: parent.identifier });

    if (!(await hasPackagePermissions(context, packageEntity.id, Permission.VIEW))) {
        return null;
    }

    const catalog = await context.connection
        .getCustomRepository(CatalogRepository)
        .findOne({ where: { id: packageEntity.catalogId } });

    if (catalog === undefined)
        throw new ApolloError("Could not find catalog " + packageEntity.catalogId, "CATALOG_NOT_FOUND");

    const identifier: PackageIdentifier = {
        registryURL: getEnvVariable("REGISTRY_URL"),
        catalogSlug: catalog.slug,
        packageSlug: packageEntity.slug
    };

    const version = await context.connection.getCustomRepository(VersionRepository).findLatestVersion({
        identifier: identifier,
        relations: getGraphQlRelationName(info)
    });

    if (version == undefined) return null;

    return versionEntityToGraphqlObject(context.connection, version);
};

export const findPackagesForCollection = async (
    parent: Collection,
    _1: any,
    context: AuthenticatedContext,
    info: any
) => {
    const collectionEntity = await context.connection
        .getCustomRepository(CollectionRepository)
        .findCollectionBySlugOrFail(parent.identifier.collectionSlug);

    if (!(await hasCollectionPermissions(context, collectionEntity.id, Permission.VIEW))) {
        return [];
    }

    const packages = await context.connection
        .getCustomRepository(PackageRepository)
        .findPackagesForCollection(context.me?.id, collectionEntity.id, getGraphQlRelationName(info));

    return await Promise.all(packages.map((p) => packageEntityToGraphqlObject(context.connection, p)));
};

export const findPackageIdentifier = async (parent: Package, _1: any, context: AuthenticatedContext, info: any) => {
    return parent.identifier;
};

export const myPackagePermissions = async (parent: Package, _0: any, context: AuthenticatedContext) => {
    const packageEntity = await context.connection
        .getCustomRepository(PackageRepository)
        .findPackageOrFail({ identifier: parent.identifier });

    const catalog = await context.connection.getRepository(CatalogEntity).findOne(packageEntity.catalogId);

    if (catalog == null) throw new Error("CATALOG_NOT_FOUND - " + packageEntity.catalogId);

    return resolvePackagePermissions(
        context,
        {
            catalogSlug: catalog?.slug,
            packageSlug: packageEntity.slug
        },
        context.me
    );
};

export const findPackageCreator = async (parent: Package, _1: any, context: AuthenticatedContext, info: any) => {
    const packageEntity = await context.connection
        .getCustomRepository(PackageRepository)
        .findPackageOrFail({ identifier: parent.identifier });

    return await context.connection.getCustomRepository(UserRepository).findOneOrFail({
        where: { id: packageEntity.creatorId },
        relations: getGraphQlRelationName(info)
    });
};

export const findPackage = async (
    _0: any,
    { identifier }: { identifier: PackageIdentifierInput },
    context: Context,
    info: any
) => {
    return context.connection.transaction(async (transaction) => {
        const packageEntity = await transaction.getCustomRepository(PackageRepository).findPackageOrFail({
            identifier,
            relations: getGraphQlRelationName(info)
        });

        packageEntity.viewCount++;
        await transaction.save(packageEntity);

        if (context.me) {
            await createActivityLog(transaction, {
                userId: context.me?.id,
                eventType: ActivityLogEventType.PACKAGE_VIEWED,
                targetPackageId: packageEntity.id
            });
        }

        return packageEntityToGraphqlObject(transaction, packageEntity);
    });
};

export const packageFetched = async (
    _0: any,
    { identifier }: { identifier: VersionIdentifierInput },
    context: AuthenticatedContext,
    info: any
) => {
    return await context.connection.transaction(async (transaction) => {
        const packageEntity = await transaction.getCustomRepository(PackageRepository).findPackageOrFail({
            identifier,
            relations: getGraphQlRelationName(info)
        });

        const versionEntity = await transaction.getCustomRepository(VersionRepository).findOneOrFail({ identifier });

        packageEntity.fetchCount++;
        await transaction.save(packageEntity);

        await createActivityLog(transaction, {
            userId: context!.me!.id,
            eventType: ActivityLogEventType.PACKAGE_FETCHED,
            targetPackageId: packageEntity.id,
            targetPackageVersionId: versionEntity.id
        });
    });
};

export const searchPackages = async (
    _0: any,
    { query, limit, offSet }: { query: string; limit: number; offSet: number },
    context: AuthenticatedContext,
    info: any
) => {
    const [searchResponse, count] = await context.connection.manager
        .getCustomRepository(PackageRepository)
        .search({ user: context.me, query, limit, offSet, relations: getRelationNames(graphqlFields(info).packages) });

    return {
        hasMore: count - (offSet + limit) > 0,
        packages: await Promise.all(searchResponse.map((p) => packageEntityToGraphqlObject(context.connection, p))),
        count
    };
};

export const createPackage = async (
    _0: any,
    { value }: { value: CreatePackageInput },
    context: AuthenticatedContext,
    info: any
) => {
    return await context.connection.transaction(async (transaction) => {
        try {
            const packageEntity = await transaction.getCustomRepository(PackageRepository).createPackage({
                userId: context.me?.id,
                packageInput: value,
                relations: getGraphQlRelationName(info)
            });

            await createActivityLog(transaction, {
                userId: context!.me!.id,
                eventType: ActivityLogEventType.PACKAGE_CREATED,
                targetPackageId: packageEntity?.id
            });

            return await packageEntityToGraphqlObject(transaction, packageEntity);
        } catch (error) {
            if (error.message == "CATALOG_NOT_FOUND") {
                throw new UserInputError("CATALOG_NOT_FOUND");
            }

            throw new ApolloError("UNKNOWN_ERROR - " + error.message);
        }
    });
};

export const updatePackage = async (
    _0: any,
    { identifier, value }: { identifier: PackageIdentifierInput; value: UpdatePackageInput },
    context: AuthenticatedContext,
    info: any
) => {
    if (value.newCatalogSlug) {
        // check that this user has the right to move this package to a different catalog
        const hasPermission = await context.connection
            .getCustomRepository(UserCatalogPermissionRepository)
            .userHasPermission({
                username: context.me.username,
                catalogSlug: value.newCatalogSlug,
                permission: Permission.EDIT
            });

        if (!hasPermission) {
            throw new ForbiddenError("NOT_AUTHORIZED");
        }
    }

    return await context.connection.transaction(async (transaction) => {
        const packageEntity = await transaction
            .getCustomRepository(PackageRepository)
            .findPackageOrFail({ identifier });

        await createActivityLog(transaction, {
            userId: context.me.id,
            eventType: ActivityLogEventType.PACKAGE_EDIT,
            targetPackageId: packageEntity.id,
            propertiesEdited: Object.keys(value)
                .map((k) => (k == "newPackageSlug" ? "slug" : k))
                .map((k) => (k == "newCatalogSlug" ? "catalogSlug" : k))
        });

        if (value.isPublic !== undefined) {
            await createActivityLog(transaction, {
                userId: context.me.id,
                eventType: ActivityLogEventType.PACKAGE_PUBLIC_CHANGED,
                targetPackageId: packageEntity.id,
                changeType: value.isPublic
                    ? ActivityLogChangeType.PUBLIC_ENABLED
                    : ActivityLogChangeType.PUBLIC_DISABLED
            });
        }

        const packageEntityUpdated = await transaction.getCustomRepository(PackageRepository).updatePackage({
            catalogSlug: identifier.catalogSlug,
            packageSlug: identifier.packageSlug,
            packageInput: value,
            relations: getGraphQlRelationName(info)
        });

        return packageEntityToGraphqlObject(context.connection, packageEntityUpdated);
    });
};

export const setPackageCoverImage = async (
    _0: any,
    { identifier, image }: { identifier: PackageIdentifierInput; image: Base64ImageUpload },
    context: AuthenticatedContext,
    info: any
) => {
    const packageEntity = await context.connection
        .getCustomRepository(PackageRepository)
        .findPackageOrFail({ identifier });
    return ImageStorageService.INSTANCE.savePackageCoverImage(packageEntity.id, image.base64);
};

export const deletePackage = async (
    _0: any,
    { identifier }: { identifier: PackageIdentifierInput },
    context: AuthenticatedContext,
    info: any
) => {
    return context.connection.transaction(async (transaction) => {
        const packageEntity = await transaction.getCustomRepository(PackageRepository).findPackageOrFail({
            identifier
        });

        await createActivityLog(transaction, {
            userId: context.me!.id,
            eventType: ActivityLogEventType.PACKAGE_DELETED,
            targetPackageId: packageEntity.id
        });

        return transaction.getCustomRepository(PackageRepository).deletePackage({
            identifier,
            context
        });
    });
};

export const setPackagePermissions = async (
    _0: any,
    {
        identifier,
        value: { usernameOrEmailAddress, permissions }
    }: { identifier: PackageIdentifierInput; value: { usernameOrEmailAddress: string; permissions: Permission[] } },
    context: AuthenticatedContext,
    info: any
) => {
    const user = await context.connection
        .getCustomRepository(UserRepository)
        .getUserByUsernameOrEmailAddress(usernameOrEmailAddress);

    const packageEntity = await context.connection.getCustomRepository(PackageRepository).findPackage({ identifier });

    if (packageEntity == null)
        throw new Error("PACKAGE_NOT_FOUND - " + identifier.catalogSlug + "/" + identifier.packageSlug);

    let userId = null;

    if (user == null) {
        if (emailAddressValid(usernameOrEmailAddress)) {
            const inviteUser = await context.connection
                .getCustomRepository(UserRepository)
                .createInviteUser(usernameOrEmailAddress);

            await sendInviteUser(inviteUser, context.me.displayName, packageEntity.displayName);

            userId = inviteUser.id;
        } else {
            throw Error("USER_NOT_FOUND - " + usernameOrEmailAddress);
        }
    } else {
        userId = user.id;
    }

    await context.connection.getCustomRepository(PackagePermissionRepository).setPackagePermissions({
        identifier,
        userId,
        permissions
    });
};

export const removePackagePermissions = async (
    _0: any,
    { identifier, username }: { identifier: PackageIdentifierInput; username: string },
    context: AuthenticatedContext
) => {
    return context.connection.getCustomRepository(PackagePermissionRepository).removePackagePermission({
        identifier,
        username
    });
};

export const userPackages = async (
    _0: any,
    { username, limit, offSet }: { username: string; limit: number; offSet: number },
    context: AuthenticatedContext,
    info: any
) => {
    const relations = getGraphQlRelationName(info);
    const [searchResponse, count] = await context.connection.manager
        .getCustomRepository(PackageRepository)
        .userPackages({ user: context.me, username, offSet, limit, relations });

    return {
        hasMore: count - (offSet + limit) > 0,
        packages: await Promise.all(searchResponse.map((p) => packageEntityToGraphqlObject(context.connection, p))),
        count
    };
};

export const catalogPackages = async (
    _0: any,
    { identifier, limit, offset }: { identifier: CatalogIdentifierInput; limit: number; offset: number },
    context: AuthenticatedContext,
    info: any
) => {
    const repository = context.connection.manager.getCustomRepository(CatalogRepository);
    const catalogEntity = await repository.findCatalogBySlugOrFail(identifier.catalogSlug);
    const relations = getGraphQlRelationName(info);
    const packages = await context.connection.manager
        .getCustomRepository(CatalogRepository)
        .catalogPackages(catalogEntity.id, limit, offset, relations);

    return packages.map((p) => packageEntityToGraphqlObject(context.connection, p));
};

export const packageDescription = async (parent: Package, _1: any, context: Context): Promise<string | null> => {
    const packageEntity = await context.connection
        .getCustomRepository(PackageRepository)
        .findPackageOrFail({ identifier: parent.identifier });

    if (!(await hasPackagePermissions(context, packageEntity.id, Permission.VIEW))) {
        return null;
    }

    return packageEntity.description || null;
};

export const packageDisplayName = async (parent: Package, _1: any, context: Context): Promise<string | null> => {
    const packageEntity = await context.connection
        .getCustomRepository(PackageRepository)
        .findPackageOrFail({ identifier: parent.identifier });

    if (!(await hasPackagePermissions(context, packageEntity.id, Permission.VIEW))) {
        return null;
    }

    return packageEntity.displayName || null;
};

export const packageCreatedAt = async (parent: Package, _1: any, context: Context): Promise<Date | null> => {
    const packageEntity = await context.connection
        .getCustomRepository(PackageRepository)
        .findPackageOrFail({ identifier: parent.identifier });

    if (!(await hasPackagePermissions(context, packageEntity.id, Permission.VIEW))) {
        return null;
    }

    return packageEntity.createdAt || null;
};

export const packageUpdatedAt = async (parent: Package, _1: any, context: Context): Promise<Date | null> => {
    const packageEntity = await context.connection
        .getCustomRepository(PackageRepository)
        .findPackageOrFail({ identifier: parent.identifier });

    if (!(await hasPackagePermissions(context, packageEntity.id, Permission.VIEW))) {
        return null;
    }

    return packageEntity.updatedAt || null;
};

export const packageFetchCount = async (parent: Package, _1: any, context: Context): Promise<number | null> => {
    const packageEntity = await context.connection
        .getCustomRepository(PackageRepository)
        .findPackageOrFail({ identifier: parent.identifier });

    if (!(await hasPackagePermissions(context, packageEntity.id, Permission.VIEW))) {
        return null;
    }

    return packageEntity.fetchCount || null;
};

export const packageViewedCount = async (parent: Package, _1: any, context: Context): Promise<number | null> => {
    const packageEntity = await context.connection
        .getCustomRepository(PackageRepository)
        .findPackageOrFail({ identifier: parent.identifier });

    if (!(await hasPackagePermissions(context, packageEntity.id, Permission.VIEW))) {
        return null;
    }

    return packageEntity.fetchCount || null;
};

export const packageIsPublic = async (parent: Package, _1: any, context: Context): Promise<boolean> => {
    const packageEntity = await context.connection
        .getCustomRepository(PackageRepository)
        .findPackageOrFail({ identifier: parent.identifier });

    return packageEntity.isPublic;
};
