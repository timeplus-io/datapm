import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatDialogModule } from "@angular/material/dialog";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatStepperModule } from "@angular/material/stepper";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatTableModule } from "@angular/material/table";

import { HeaderComponent } from "./header/header.component";
import { FooterComponent } from "./footer/footer.component";
import { TimeAgoPipe } from "./pipes/time-ago.pipe";
import { ImageUploadModalComponent } from "./image-upload-modal/image-upload-modal.component";
import { PackageItemComponent } from "./package-item/package-item.component";
import { CollectionItemComponent } from "./collection-item/collection-item.component";
import { ForgotPasswordDialogComponent } from "./header/forgot-password-dialog/forgot-password-dialog.component";
import { LoginDialogComponent } from "./header/login-dialog/login-dialog.component";
import { SignUpDialogComponent } from "./header/sign-up-dialog/sign-up-dialog.component";
import { AvatarComponent } from "./avatar/avatar.component";
import { UsernamePipe } from "./pipes/username.pipe";
import { CoverComponent } from "./cover/cover.component";
import { PercentPipe } from "./pipes/percent.pipe";
import { ValuesPipe } from "./pipes/values.pipe";
import { SortByPipe } from "./pipes/sort.pipe";
import { InputComponent } from "./input/input.component";
import { InputErrorPipe } from "./pipes/input-error.pipe";
import { EditCollectionComponent } from "./edit-collection/edit-collection.component";
import { ConfirmationDialogComponent } from "./confirmation-dialog/confirmation-dialog.component";
import { EditCatalogComponent } from "./edit-catalog/edit-catalog.component";
import { CreateCollectionComponent } from "./create-collection/create-collection.component";
import { UserDetailsHeaderComponent } from "./user-details/user-details-header/user-details-header.component";
import { CatalogsComponent } from "./user-details/catalogs/catalogs.component";
import { DeleteConfirmationComponent } from "./user-details/delete-confirmation/delete-confirmation.component";
import { FewPackagesAlertComponent } from "./user-details/few-packages-alert/few-packages-alert.component";
import { MyCollectionsComponent } from "./user-details/my-collections/my-collections.component";
import { PackagesComponent } from "./user-details/packages/packages.component";
import { EditAccountDialogComponent } from "./user-details/edit-account-dialog/edit-account-dialog.component";
import { EditPasswordDialogComponent } from "./user-details/edit-password-dialog/edit-password-dialog.component";
import { DetailsComponent } from "./user-details/user-details/user-details.component";

@NgModule({
    declarations: [
        HeaderComponent,
        FooterComponent,
        TimeAgoPipe,
        ImageUploadModalComponent,
        PackageItemComponent,
        CollectionItemComponent,
        ForgotPasswordDialogComponent,
        LoginDialogComponent,
        SignUpDialogComponent,
        AvatarComponent,
        UsernamePipe,
        CoverComponent,
        PercentPipe,
        ValuesPipe,
        SortByPipe,
        InputComponent,
        InputErrorPipe,
        EditCollectionComponent,
        ConfirmationDialogComponent,
        EditCatalogComponent,
        CreateCollectionComponent,
        UserDetailsHeaderComponent,
        CatalogsComponent,
        DeleteConfirmationComponent,
        FewPackagesAlertComponent,
        MyCollectionsComponent,
        PackagesComponent,
        EditAccountDialogComponent,
        EditPasswordDialogComponent,
        DetailsComponent
    ],
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatMenuModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatStepperModule,
        MatSlideToggleModule,
        MatTableModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule
    ],
    exports: [
        HeaderComponent,
        FooterComponent,
        TimeAgoPipe,
        PackageItemComponent,
        CollectionItemComponent,
        ForgotPasswordDialogComponent,
        LoginDialogComponent,
        SignUpDialogComponent,
        AvatarComponent,
        UsernamePipe,
        CoverComponent,
        PercentPipe,
        ValuesPipe,
        SortByPipe,
        InputComponent,
        InputErrorPipe,
        EditCollectionComponent,
        ConfirmationDialogComponent,
        EditCatalogComponent,
        CreateCollectionComponent,
        UserDetailsHeaderComponent,
        CatalogsComponent,
        DeleteConfirmationComponent,
        FewPackagesAlertComponent,
        MyCollectionsComponent,
        PackagesComponent,
        EditAccountDialogComponent,
        EditPasswordDialogComponent,
        DetailsComponent
    ],
    providers: [TimeAgoPipe]
})
export class SharedModule {}
