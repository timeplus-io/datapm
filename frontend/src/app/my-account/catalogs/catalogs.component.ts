import { Component, OnInit } from "@angular/core";
import { Catalog, MyCatalogsGQL, UpdateCatalogGQL, DisableCatalogGQL } from "src/generated/graphql";
import { Subject } from "rxjs";
import { take, takeUntil } from "rxjs/operators";
import { MatDialog } from "@angular/material/dialog";
import { DeleteConfirmationComponent } from "../delete-confirmation/delete-confirmation.component";

enum State {
    INIT,
    LOADING,
    ERROR,
    SUCCESS,
    ERROR_NOT_UNIQUE,
    ERROR_NO_LABEL
}
@Component({
    selector: "me-catalogs",
    templateUrl: "./catalogs.component.html",
    styleUrls: ["./catalogs.component.scss"]
})
export class CatalogsComponent implements OnInit {
    catalogState = State.INIT;
    public myCatalogs: Catalog[];
    private subscription = new Subject();
    columnsToDisplay = ["name", "public", "actions"];

    constructor(
        private myCatalogsGQL: MyCatalogsGQL,
        private updateCatalogGQL: UpdateCatalogGQL,
        private disableCatalogGQL: DisableCatalogGQL,
        private dialog: MatDialog
    ) {}

    ngOnInit(): void {
        this.refreshCatalogs();
    }

    refreshCatalogs() {
        this.myCatalogsGQL
            .fetch()
            .pipe(takeUntil(this.subscription))
            .subscribe((response) => {
                if (response.errors?.length > 0) {
                    this.catalogState = State.ERROR;
                    return;
                }
                this.myCatalogs = response.data.myCatalogs;
                console.log(this.myCatalogs);
                this.catalogState = State.SUCCESS;
            });
    }

    updateCatalogVisibility(catalog: Catalog, isPublic: boolean) {
        this.updateCatalogGQL
            .mutate({
                identifier: {
                    catalogSlug: catalog.identifier.catalogSlug
                },
                value: {
                    isPublic
                }
            })
            .subscribe(() => {});
    }

    deleteCatalog(catalog: Catalog) {
        const dlgRef = this.dialog.open(DeleteConfirmationComponent, {
            data: {
                catalogSlug: catalog.identifier.catalogSlug
            }
        });

        dlgRef.afterClosed().subscribe((confirmed: boolean) => {
            if (confirmed) {
                this.disableCatalogGQL
                    .mutate({
                        identifier: {
                            catalogSlug: catalog.identifier.catalogSlug
                        }
                    })
                    .subscribe(() => {
                        this.myCatalogs = this.myCatalogs.filter(
                            (c) => c.identifier.catalogSlug !== catalog.identifier.catalogSlug
                        );
                    });
            }
        });
    }
}
