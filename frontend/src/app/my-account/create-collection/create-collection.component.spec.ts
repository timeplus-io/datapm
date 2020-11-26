import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";

import { CreateCollectionComponent } from "./create-collection.component";

describe("CreateCollectionComponent", () => {
    let component: CreateCollectionComponent;
    let fixture: ComponentFixture<CreateCollectionComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [CreateCollectionComponent],
            imports: [MatDialogModule, ReactiveFormsModule],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: {}
                }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CreateCollectionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
