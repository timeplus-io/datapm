import { BigQueryConnectorDescription } from "./database/big-query/BigQueryConnectorDescription";
import { MongoRepositoryDescripton } from "./database/mongo/MongoConnectorDescription";
import { MySqlConnectorDescription } from "./database/mysql/MySqlConnectorDescription";
import { PostgresConnectorDescription } from "./database/postgres/PostgresConnectorDescription";
import { RedshiftConnectorDescription } from "./database/redshift/RedshiftConnectorDescription";
import { GoogleSheetConnectorDescription } from "./file-based/google-sheet/GoogleSheetConnectorDescription";
import { HTTPConnectorDescription } from "./file-based/http/HTTPConnectorDescription";
import { LocalFileConnectorDescription } from "./file-based/local-file/LocalFileConnectorDescription";
import { StandardOutConnectorDescription } from "./file-based/standard-out/StandardOutConnectorDescription";
import { ConnectorDescription } from "./Connector";
import { StreamTestConnectorDescription } from "./stream/test/StreamTestConnectorDescription";
import { DataPMConnectorDescription } from "./file-based/datapm-registry/DataPMConnectorDescription";
import { DecodableConnectorDescription } from "./stream/decodable/DecodableConnectorDescription";

export const CONNECTORS: ConnectorDescription[] = [
    new BigQueryConnectorDescription(),
    new MongoRepositoryDescripton(),
    new MySqlConnectorDescription(),
    new PostgresConnectorDescription(),
    new RedshiftConnectorDescription(),
    new GoogleSheetConnectorDescription(),
    new HTTPConnectorDescription(),
    new LocalFileConnectorDescription(),
    new StandardOutConnectorDescription(),
    new DecodableConnectorDescription()
];

/** These are never presented to the user as an option, but are available if the user knows they exist.
 * This can be used for hiding 'test' and depreciated implementations */
export const EXTENDED_REPOSITORIES: ConnectorDescription[] = CONNECTORS.concat([
    new StreamTestConnectorDescription(),
    new DataPMConnectorDescription()
]);

export function getConnectorDescriptions(): ConnectorDescription[] {
    return CONNECTORS.sort((a, b) => a.getDisplayName().localeCompare(b.getDisplayName()));
}

export function getConnectorDescriptionByType(type: string): ConnectorDescription | undefined {
    return EXTENDED_REPOSITORIES.find((r) => r.getType() === type);
}
