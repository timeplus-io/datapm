import {
    leastCompatible,
    compareSchema,
    Compability,
    DifferenceType,
    diffCompatibility,
    nextVersion,
    comparePackages
} from "../src/PackageUtil";
import {
    Schema,
    Properties,
    PackageFile,
    catalogSlugValid,
    packageSlugValid,
    collectionSlugValid,
    Source,
    compareSource,
    compareSources
} from "../src/main";
import { SemVer } from "semver";
import { expect } from "chai";

describe("Checking VersionUtil", () => {
    it("Compatibility ENUM Order", () => {
        expect(leastCompatible(Compability.Identical, Compability.BreakingChange)).equal(Compability.BreakingChange);
    });

    it("No change test", () => {
        const oldVersion = new SemVer("1.0.3");
        const newVersion = nextVersion(oldVersion, Compability.Identical);

        expect(oldVersion.version).equal("1.0.3");
        expect(newVersion.version).equal("1.0.3");
    });

    it("Minor change test", () => {
        const oldVersion = new SemVer("1.0.3");
        const newVersion = nextVersion(oldVersion, Compability.MinorChange);

        expect(oldVersion.version).equal("1.0.3");
        expect(newVersion.version).equal("1.0.4");
    });

    it("Compatible change test", () => {
        const oldVersion = new SemVer("1.0.3");
        const newVersion = nextVersion(oldVersion, Compability.CompatibleChange);

        expect(oldVersion.version).equal("1.0.3");
        expect(newVersion.version).equal("1.1.0");
    });

    it("Breaking change test", () => {
        const oldVersion = new SemVer("1.0.3");
        const newVersion = nextVersion(oldVersion, Compability.BreakingChange);

        expect(oldVersion.version).equal("1.0.3");
        expect(newVersion.version).equal("2.0.0");
    });

    it("Simple property schema comparison", () => {
        const schemaA1: Schema = {
            title: "SchemaA",
            type: "string",
            format: "date-time"
        };

        const schemaA2: Schema = {
            title: "SchemaA",
            type: "string",
            format: "date-time"
        };

        expect(compareSchema(schemaA1, schemaA2).length).equal(0);

        schemaA2.format = "date";

        const changeTitle = compareSchema(schemaA1, schemaA2);

        expect(changeTitle[0].type).equal(DifferenceType.CHANGE_PROPERTY_FORMAT);
    });

    it("Type arrays vs singluar values", () => {
        const schemaA1: Schema = {
            title: "SchemaA",
            type: "object",
            properties: {
                string: { title: "string", type: "string" },
                number: { title: "number", type: "number" }
            }
        };

        const schemaA2: Schema = {
            title: "SchemaA",
            type: "object",
            properties: {
                string: { title: "string", type: "string" },
                number: { title: "number", type: "number" }
            }
        };

        const diff = compareSchema(schemaA1, schemaA2);

        expect(diff.length).equal(0);

        (schemaA1.properties as Properties).string.type = ["string", "number"];

        const arrayVsNotDiff = compareSchema(schemaA1, schemaA2);

        expect(arrayVsNotDiff.length).equal(1);
        expect(arrayVsNotDiff[0].type).equal(DifferenceType.CHANGE_PROPERTY_TYPE);

        (schemaA2.properties as Properties).string.type = ["string", "number"];

        const equalDiff = compareSchema(schemaA1, schemaA2);

        expect(equalDiff.length).equal(0);
    });

    it("Object schema comparison", () => {
        const schemaA1: Schema = {
            title: "SchemaA",
            type: "object",
            properties: {
                string: { title: "string", type: "string" },
                number: { title: "number", type: "number" }
            }
        };

        const schemaA2: Schema = {
            title: "SchemaA",
            type: "object",
            properties: {
                string: { title: "string", type: "string" },
                number: { title: "number", type: "number" }
            }
        };

        const diff = compareSchema(schemaA1, schemaA2);

        expect(diff.length).equal(0);

        (schemaA2.properties as Properties).boolean = { title: "boolean", type: "boolean" };

        const compatibleChange = compareSchema(schemaA1, schemaA2);

        expect(compatibleChange.length).equal(1);

        expect(compatibleChange[0].type).equal(DifferenceType.ADD_PROPERTY);

        (schemaA1.properties as Properties).date = {
            title: "date",
            type: "string",
            format: "date"
        };

        const addPropertyDiff = compareSchema(schemaA1, schemaA2);
        expect(addPropertyDiff.length).equal(2);

        const propertyRemoved = addPropertyDiff.find((d) => d.type === DifferenceType.ADD_PROPERTY);

        expect(propertyRemoved != null).equal(true);

        (schemaA1.properties as Properties).boolean = { title: "boolean", type: "boolean" };
        (schemaA2.properties as Properties).date = {
            title: "date",
            type: "string",
            format: "date"
        };

        const finalDiff = compareSchema(schemaA1, schemaA2);
        expect(finalDiff).length(0);
    });

    it("Diff compatibility testing", () => {
        expect(nextVersion(new SemVer("1.0.2"), Compability.BreakingChange).version).equal(new SemVer("2.0.0").version);

        expect(nextVersion(new SemVer("1.0.3"), Compability.CompatibleChange).version).equal(
            new SemVer("1.1.0").version
        );

        expect(nextVersion(new SemVer("1.0.3"), Compability.MinorChange).version).equal(new SemVer("1.0.4").version);
    });

    it("Nested Objects Comparison", () => {
        const schemaA1: Schema = {
            title: "SchemaA",
            type: "object",
            properties: {
                object: {
                    title: "object",
                    type: "object",
                    properties: {
                        string1: { type: "string" }
                    }
                },
                number: { title: "number", type: "number" }
            }
        };

        const schemaA2: Schema = {
            title: "SchemaA",
            type: "object",
            properties: {
                object: {
                    title: "object",
                    type: "object",
                    properties: {
                        string1: { type: "string" }
                    }
                },
                number: { title: "number", type: "number" }
            }
        };

        const firstDiff = compareSchema(schemaA1, schemaA2);
        expect(firstDiff).length(0);

        expect(diffCompatibility(firstDiff)).equal(Compability.Identical);

        ((schemaA2.properties as Properties).object.properties as Properties).string2 = { type: "string" };

        const compatibleDiff = compareSchema(schemaA1, schemaA2);

        expect(compatibleDiff).length(1);

        expect(compatibleDiff[0].type).equal(DifferenceType.ADD_PROPERTY);
        expect(compatibleDiff[0].pointer).equal("#/SchemaA/properties/object/properties/string2");

        const compatibleComparison = diffCompatibility(compatibleDiff);

        expect(compatibleComparison).equal(Compability.CompatibleChange);

        ((schemaA1.properties as Properties).object.properties as Properties).string3 = { type: "string" };

        const breakingDiff = compareSchema(schemaA1, schemaA2);
        expect(breakingDiff).length(2);

        expect(breakingDiff[0].type).equal(DifferenceType.REMOVE_PROPERTY);
        expect(breakingDiff[0].pointer).equal("#/SchemaA/properties/object");
        expect(breakingDiff[1].type).equal(DifferenceType.ADD_PROPERTY);
        expect(breakingDiff[1].pointer).equal("#/SchemaA/properties/object/properties/string2");

        const breakingChange = diffCompatibility(breakingDiff);

        expect(breakingChange).equal(Compability.BreakingChange);

        ((schemaA1.properties as Properties).object.properties as Properties).string2 = { type: "string" };
        ((schemaA2.properties as Properties).object.properties as Properties).string3 = { type: "string" };

        const finalDiff = compareSchema(schemaA1, schemaA2);

        expect(finalDiff).length(0);

        expect(diffCompatibility(finalDiff)).equal(Compability.Identical);
    });

    it("Catalog slug validation", () => {
        expect(catalogSlugValid("a")).equal(true);
        expect(catalogSlugValid("0")).equal(true);
        expect(catalogSlugValid("a-b")).equal(true);
        expect(catalogSlugValid("a-b-123")).equal(true);
        expect(catalogSlugValid("a".repeat(39))).equal("CATALOG_SLUG_TOO_LONG");

        expect(catalogSlugValid(undefined)).equal("CATALOG_SLUG_REQUIRED");
        expect(catalogSlugValid("")).equal("CATALOG_SLUG_REQUIRED");
        expect(catalogSlugValid("a_b")).equal("CATALOG_SLUG_INVALID");
        expect(catalogSlugValid("a--b")).equal("CATALOG_SLUG_INVALID");
        expect(catalogSlugValid("a-b-")).equal("CATALOG_SLUG_INVALID");
        expect(catalogSlugValid("-a-b")).equal("CATALOG_SLUG_INVALID");
    });

    it("Package slug validation", () => {
        expect(packageSlugValid("a")).equal(true);
        expect(packageSlugValid("0")).equal(true);
        expect(packageSlugValid("a.b")).equal(true);
        expect(packageSlugValid("a--b")).equal(true);
        expect(packageSlugValid("a__b")).equal(true);
        expect(packageSlugValid("a__b----c.123")).equal(true);
        expect(packageSlugValid("a".repeat(100))).equal("PACKAGE_SLUG_TOO_LONG");

        expect(packageSlugValid(undefined)).equal("PACKAGE_SLUG_REQUIRED");
        expect(packageSlugValid("")).equal("PACKAGE_SLUG_REQUIRED");
        expect(packageSlugValid(".")).equal("PACKAGE_SLUG_INVALID");
        expect(packageSlugValid("-")).equal("PACKAGE_SLUG_INVALID");
        expect(packageSlugValid("_")).equal("PACKAGE_SLUG_INVALID");
        expect(packageSlugValid("a@b")).equal("PACKAGE_SLUG_INVALID");
        expect(packageSlugValid("a.")).equal("PACKAGE_SLUG_INVALID");
        expect(packageSlugValid("a..b")).equal("PACKAGE_SLUG_INVALID");
        expect(packageSlugValid("a-")).equal("PACKAGE_SLUG_INVALID");
        expect(packageSlugValid("a_")).equal("PACKAGE_SLUG_INVALID");
        expect(packageSlugValid("a___c")).equal("PACKAGE_SLUG_INVALID");
    });

    it("Collection slug validation", () => {
        expect(collectionSlugValid("a")).equal(true);
        expect(collectionSlugValid("a--b")).equal("COLLECTION_SLUG_INVALID");
        expect(collectionSlugValid("a__b")).equal("COLLECTION_SLUG_INVALID");
        expect(collectionSlugValid("a__b----c.123")).equal("COLLECTION_SLUG_INVALID");
        expect(collectionSlugValid("a".repeat(101))).equal("COLLECTION_SLUG_TOO_LONG");
        expect(collectionSlugValid(undefined)).equal("COLLECTION_SLUG_REQUIRED");
        expect(collectionSlugValid("a.b")).equal("COLLECTION_SLUG_INVALID");
        expect(collectionSlugValid("")).equal("COLLECTION_SLUG_REQUIRED");
        expect(collectionSlugValid("0")).equal(true);
        expect(collectionSlugValid(".")).equal("COLLECTION_SLUG_INVALID");
        expect(collectionSlugValid("-")).equal("COLLECTION_SLUG_INVALID");
        expect(collectionSlugValid("_")).equal("COLLECTION_SLUG_INVALID");
        expect(collectionSlugValid("a@b")).equal("COLLECTION_SLUG_INVALID");
        expect(collectionSlugValid("a.")).equal("COLLECTION_SLUG_INVALID");
        expect(collectionSlugValid("a..b")).equal("COLLECTION_SLUG_INVALID");
        expect(collectionSlugValid("a-")).equal("COLLECTION_SLUG_INVALID");
        expect(collectionSlugValid("a_")).equal("COLLECTION_SLUG_INVALID");
        expect(collectionSlugValid("a___c")).equal("COLLECTION_SLUG_INVALID");
    });

    it("Compare identical schemas", () => {
        const schemaA1: Schema = {
            title: "SchemaA",
            type: "string",
            format: "date-time"
        };

        const schemaA2: Schema = {
            title: "SchemaA",
            type: "string",
            format: "date-time"
        };

        const diffs = compareSchema(schemaA1, schemaA2);

        console.log(JSON.stringify(diffs, null, 1));

        expect(diffs.length).equal(0);
    });

    it("Compare source objects", () => {
        const sourceA: Source = {
            type: "test",
            uris: ["http://datapm.io/test", "http://datapm.io/test2"],
            configuration: {},
            lastUpdateHash: "abc123",
            schemaTitles: ["A"],
            streamStats: {
                inspectedCount: 0
            }
        };

        const sourceB: Source = {
            type: "test",
            uris: ["http://datapm.io/test", "http://datapm.io/test2"],
            configuration: {},
            lastUpdateHash: "abc123",
            schemaTitles: ["A"],
            streamStats: {
                inspectedCount: 0
            }
        };

        const diffs = compareSource(sourceA, sourceB);

        expect(diffs.length).equals(0);

        sourceA.lastUpdateHash = "test";

        const diffs2 = compareSource(sourceA, sourceB);

        expect(diffs2[0].type).equal(DifferenceType.CHANGE_SOURCE_UPDATE_HASH);

        sourceA.lastUpdateHash = sourceB.lastUpdateHash;

        sourceA.uris = ["http://datapm.io.test"];

        const diffs3 = compareSource(sourceA, sourceB);

        expect(diffs3[0].type).equal(DifferenceType.CHANGE_SOURCE);
    });

    it("Compare source arrays", () => {
        const sourceA: Source[] = [
            {
                type: "test",
                uris: ["http://datapm.io/test", "http://datapm.io/test2"],
                configuration: {},
                lastUpdateHash: "abc123",
                schemaTitles: ["A"],
                streamStats: {
                    inspectedCount: 0
                }
            }
        ];

        const sourceB: Source[] = [
            {
                type: "test",
                uris: ["http://datapm.io/test", "http://datapm.io/test2"],
                configuration: {},
                lastUpdateHash: "abc123",
                schemaTitles: ["A"],
                streamStats: {
                    inspectedCount: 0
                }
            }
        ];

        const diffs = compareSources(sourceA, sourceB);

        expect(diffs.length).equals(0);

        sourceA[0].uris = ["test"];

        const diffs2 = compareSources(sourceA, sourceB);

        expect(diffs2[0].type).equal(DifferenceType.CHANGE_SOURCE);
    });

    it("Stream status change detection", () => {
        const sourceA: Source[] = [
            {
                type: "test",
                uris: ["http://datapm.io/test", "http://datapm.io/test2"],
                configuration: {},
                lastUpdateHash: "abc123",
                schemaTitles: ["A"],
                streamStats: {
                    inspectedCount: 0
                }
            }
        ];

        const sourceB: Source[] = [
            {
                type: "test",
                uris: ["http://datapm.io/test", "http://datapm.io/test2"],
                configuration: {},
                lastUpdateHash: "abc123",
                schemaTitles: ["A"],
                streamStats: {
                    inspectedCount: 1
                }
            }
        ];

        const diffs = compareSources(sourceA, sourceB);

        expect(diffs.length).equals(1);

        expect(diffs[0].type).equal(DifferenceType.CHANGE_SOURCE_STATS);
    });

    it("Package File updated dates", function () {
        const packageFileA: PackageFile = {
            ...new PackageFile(),
            packageSlug: "test",
            displayName: "test",
            generatedBy: "test",
            schemas: [],
            version: "1.0.0",
            updatedDate: new Date(),
            description: "Back test",
            sources: []
        };

        const packageFileB: PackageFile = {
            ...new PackageFile(),
            packageSlug: "test",
            displayName: "test",
            generatedBy: "test",
            schemas: [],
            version: "1.0.0",
            updatedDate: packageFileA.updatedDate,
            description: "Back test",
            sources: []
        };

        expect(comparePackages(packageFileA, packageFileB).some((d) => d.type === "CHANGE_UPDATED_DATE")).equal(false);

        packageFileB.updatedDate = new Date(new Date().getTime() - 100);

        const diff = comparePackages(packageFileA, packageFileB);

        expect(diff.some((d) => d.type === "CHANGE_UPDATED_DATE")).equal(true);
    });

    it("Package File updated versions", function () {
        const packageFileA: PackageFile = {
            ...new PackageFile(),
            packageSlug: "test",
            displayName: "test",
            generatedBy: "test",
            schemas: [],
            sources: [],
            version: "1.0.0",
            updatedDate: new Date(),
            description: "Back test"
        };

        const packageFileB: PackageFile = {
            ...new PackageFile(),
            packageSlug: "test",
            displayName: "test",
            generatedBy: "test",
            schemas: [],
            sources: [],
            version: "1.0.0",
            updatedDate: packageFileA.updatedDate,
            description: "Back test"
        };

        expect(comparePackages(packageFileA, packageFileB).some((d) => d.type === "CHANGE_VERSION")).equal(false);

        packageFileB.version = "1.0.1";

        const diff = comparePackages(packageFileA, packageFileB);

        expect(diff.some((d) => d.type === "CHANGE_VERSION")).equal(true);
    });

    it("Package File updated readme", function () {
        const packageFileA: PackageFile = {
            ...new PackageFile(),
            packageSlug: "test",
            displayName: "test",
            generatedBy: "test",
            schemas: [],
            sources: [],

            version: "1.0.0",
            updatedDate: new Date(),
            description: "Back test",
            readmeMarkdown: "Some readme content"
        };

        const packageFileB: PackageFile = {
            ...new PackageFile(),
            packageSlug: "test",
            displayName: "test",
            generatedBy: "test",
            schemas: [],
            sources: [],

            version: "1.0.0",
            updatedDate: packageFileA.updatedDate,
            description: "Back test",
            readmeMarkdown: packageFileA.readmeMarkdown
        };

        expect(
            comparePackages(packageFileA, packageFileB).some((d) => d.type === DifferenceType.CHANGE_README_MARKDOWN)
        ).equal(false);

        packageFileB.readmeFile = "some-new-file.README.md";
        expect(
            comparePackages(packageFileA, packageFileB).some((d) => d.type === DifferenceType.CHANGE_README_FILE)
        ).equal(true);

        packageFileB.readmeMarkdown = "other content";

        const diff = comparePackages(packageFileA, packageFileB);

        expect(diff.some((d) => d.type === DifferenceType.CHANGE_README_MARKDOWN)).equal(true);
    });

    it("Package File updated license", function () {
        const packageFileA: PackageFile = {
            ...new PackageFile(),
            packageSlug: "test",
            displayName: "test",
            generatedBy: "test",
            schemas: [],
            sources: [],

            version: "1.0.0",
            updatedDate: new Date(),
            description: "Back test",
            licenseMarkdown: "Some content"
        };

        const packageFileB: PackageFile = {
            ...new PackageFile(),
            packageSlug: "test",
            displayName: "test",
            generatedBy: "test",
            schemas: [],
            sources: [],
            version: "1.0.0",
            updatedDate: packageFileA.updatedDate,
            description: "Back test",
            licenseMarkdown: packageFileA.licenseMarkdown
        };

        expect(
            comparePackages(packageFileA, packageFileB).some((d) => d.type === DifferenceType.CHANGE_LICENSE_MARKDOWN)
        ).equal(false);

        packageFileB.licenseFile = "some-new-file.LICENSE.md";
        expect(
            comparePackages(packageFileA, packageFileB).some((d) => d.type === DifferenceType.CHANGE_LICENSE_FILE)
        ).equal(true);

        packageFileB.licenseMarkdown = "other content";

        const diff = comparePackages(packageFileA, packageFileB);

        expect(diff.some((d) => d.type === DifferenceType.CHANGE_LICENSE_MARKDOWN)).equal(true);
    });

    it("Package File updated contact email", function () {
        const packageFileA: PackageFile = {
            ...new PackageFile(),
            packageSlug: "test",
            displayName: "test",
            generatedBy: "test",
            schemas: [],
            sources: [],

            version: "1.0.0",
            updatedDate: new Date(),
            description: "Back test",
            readmeMarkdown: "Some readme content",
            contactEmail: "test@test.com"
        };

        const packageFileB: PackageFile = {
            ...new PackageFile(),
            packageSlug: "test",
            displayName: "test",
            generatedBy: "test",
            schemas: [],
            sources: [],

            version: "1.0.0",
            updatedDate: packageFileA.updatedDate,
            description: "Back test",
            readmeMarkdown: packageFileA.readmeMarkdown,
            contactEmail: packageFileA.contactEmail
        };

        expect(
            comparePackages(packageFileA, packageFileB).some((d) => d.type === DifferenceType.CHANGE_CONTACT_EMAIL)
        ).equal(false);

        packageFileB.contactEmail = "testb@test.com";
        expect(
            comparePackages(packageFileA, packageFileB).some((d) => d.type === DifferenceType.CHANGE_CONTACT_EMAIL)
        ).equal(true);
    });

    it("Package File updated website", function () {
        const packageFileA: PackageFile = {
            ...new PackageFile(),
            packageSlug: "test",
            displayName: "test",
            generatedBy: "test",
            schemas: [],
            sources: [],

            version: "1.0.0",
            updatedDate: new Date(),
            description: "Back test",
            readmeMarkdown: "Some readme content",
            contactEmail: "test@test.com",
            website: "https://dreamingwell.com"
        };

        const packageFileB: PackageFile = {
            ...new PackageFile(),
            packageSlug: "test",
            displayName: "test",
            generatedBy: "test",
            schemas: [],
            sources: [],

            version: "1.0.0",
            updatedDate: packageFileA.updatedDate,
            description: "Back test",
            readmeMarkdown: packageFileA.readmeMarkdown,
            contactEmail: packageFileA.contactEmail,
            website: packageFileA.website
        };

        expect(comparePackages(packageFileA, packageFileB).some((d) => d.type === DifferenceType.CHANGE_WEBSITE)).equal(
            false
        );

        packageFileB.website = "https://datapm.io";
        expect(comparePackages(packageFileA, packageFileB).some((d) => d.type === DifferenceType.CHANGE_WEBSITE)).equal(
            true
        );
    });

    // TODO Add test for removing a schema

    // TODO Add test for removing a hidden schema

    // TODO Add test for removing a hidden property
});
