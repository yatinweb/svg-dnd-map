import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-sensor-detail-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Sensor Details</h2>
    <mat-dialog-content>
      <p><strong>Type:</strong> {{ data.type }}</p>
      <p><strong>Area:</strong> {{ data.area }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onDelete()">Delete</button>
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `
})
export class SensorDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SensorDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onDelete(): void {
    this.dialogRef.close({ delete: true, id: this.data.id });
  }
}
