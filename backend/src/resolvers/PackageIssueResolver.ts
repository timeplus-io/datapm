import { AuthenticatedContext } from "../context";
import { PackageIssueEntity } from "../entity/PackageIssueEntity";
import { PackageIssueStatus } from "../entity/PackageIssueStatus";
import { CreatePackageIssueInput, PackageIdentifierInput } from "../generated/graphql";
import { OrderBy } from "../repository/OrderBy";
import { PackageIssueRepository } from "../repository/PackageIssueRepository";
import { PackageRepository } from "../repository/PackageRepository";
import { getGraphQlRelationName } from "../util/relationNames";

export const getIssuesByPackage = async (
    _0: any,
    {
        packageIdentifier,
        offset,
        limit,
        orderBy
    }: { packageIdentifier: PackageIdentifierInput; offset: number; limit: number; orderBy: OrderBy },
    context: AuthenticatedContext,
    info: any
) => {
    const relations = getGraphQlRelationName(info);

    const packageEntity = await context.connection.manager
        .getCustomRepository(PackageRepository)
        .findPackageOrFail({ identifier: packageIdentifier });

    const [issues, count] = await context.connection.manager
        .getCustomRepository(PackageIssueRepository)
        .getIssuesByPackage(packageEntity.id, offset, limit, orderBy, relations);

    return {
        issues,
        hasMore: count - (offset + limit) > 0,
        count
    };
};

export const createPackageIssue = async (
    _0: any,
    { packageIdentifier, issue }: { packageIdentifier: PackageIdentifierInput; issue: CreatePackageIssueInput },
    context: AuthenticatedContext,
    info: any
) => {
    const packageEntity = await context.connection.manager
        .getCustomRepository(PackageRepository)
        .findPackageOrFail({ identifier: packageIdentifier });

    const issueRepository = context.connection.manager.getCustomRepository(PackageIssueRepository);
    const lastIssueCreatedForPackage = await issueRepository.getLastCreatedIssueForPackage(packageEntity.id);
    const issueNumber = lastIssueCreatedForPackage ? lastIssueCreatedForPackage.issueNumber + 1 : 0;

    const issueEntity = new PackageIssueEntity();
    issueEntity.issueNumber = issueNumber;
    issueEntity.packageId = packageEntity.id;
    issueEntity.creatorId = context.me.id;
    issueEntity.subject = issue.subject;
    issueEntity.content = issue.content;
    issueEntity.status = PackageIssueStatus.OPEN;

    return await issueRepository.save(issueEntity);
};
