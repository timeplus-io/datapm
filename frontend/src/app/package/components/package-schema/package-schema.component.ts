import { Component, Input, OnChanges, OnDestroy } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Schema, ValueTypeStatistics } from "datapm-lib";
import { Subject } from "rxjs";
import { SamplesFullScreenDialog } from "../package-samples/samples-fullscreen-dialog.component";

@Component({
    selector: "schema",
    templateUrl: "./package-schema.component.html",
    styleUrls: ["./package-schema.component.scss"]
})
export class PackageSchemaComponent implements OnDestroy, OnChanges {
    private readonly MAX_PROPERTIES_TO_SHOW_INITIALLY = 2; // TODO: CHANGE THIS TO 5

    @Input()
    public schema: Schema;

    public propertiesToShowCount = this.MAX_PROPERTIES_TO_SHOW_INITIALLY;

    public shouldShowMorePropertiesButton: boolean = false;
    public isShowingMorePropertiesText: boolean = false;

    private unsubscribe$ = new Subject();

    constructor(private dialog: MatDialog) {}

    public ngOnChanges(): void {
        console.log(this.schemaPropertiesLength(this.schema));
        this.shouldShowMorePropertiesButton =
            this.schemaPropertiesLength(this.schema) > this.MAX_PROPERTIES_TO_SHOW_INITIALLY;
        console.log(this.shouldShowMorePropertiesButton);
    }

    public toggleShowMoreProperties(): void {
        this.isShowingMorePropertiesText = !this.isShowingMorePropertiesText;
        this.propertiesToShowCount = this.isShowingMorePropertiesText
            ? this.schemaPropertiesLength(this.schema)
            : this.MAX_PROPERTIES_TO_SHOW_INITIALLY;
    }

    public ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    public getPropertyTypes(property: Schema): string {
        const keys = Object.keys(property.valueTypes).sort();
        return keys.join(",");
    }

    public schemaPropertiesLength(schema: Schema): number {
        return Object.keys(schema.properties).length;
    }

    public showSamplesFullscreen(schema: Schema): void {
        this.dialog.open(SamplesFullScreenDialog, {
            width: "95vw",
            height: "95vh",
            maxWidth: "95vw",
            maxHeight: "95vh",
            data: {
                schema
            }
        });
    }

    public stringOptions(valueTypes: ValueTypeStatistics): { name: string; value: number }[] {
        return Object.keys(valueTypes)
            .map((v) => {
                return {
                    name: v,
                    value: valueTypes[v]
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }
}
