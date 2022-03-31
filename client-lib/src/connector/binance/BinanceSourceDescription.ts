import { Source, SourceDescription } from "../Source";
import { DISPLAY_NAME, TYPE } from "./BinanceConnectorDescription";

export const URI = "wss://ws.binance.com";

export class BinanceSourceDescription implements SourceDescription {
    sourceType(): string {
        return TYPE;
    }

    getDisplayName(): string {
        return DISPLAY_NAME;
    }

    supportsURI(uri: string): boolean {
        return uri.startsWith(URI);
    }

    async getSource(): Promise<Source> {
        const source = await import("./BinanceSource");
        return new source.BinanceSource();
    }
}
