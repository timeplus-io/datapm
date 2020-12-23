import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatTableModule } from "@angular/material/table";

import { CatalogPermissionsComponent } from "./catalog-permissions.component";

describe("CollectionPermissionsComponent", () => {
    let component: CatalogPermissionsComponent;
    let fixture: ComponentFixture<CatalogPermissionsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [CatalogPermissionsComponent],
            imports: [MatSlideToggleModule, MatTableModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CatalogPermissionsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
