import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-sensor-detail-dialog',
  standalone: true,
  imports: [MatDialogModule],
  template: `
    <h2 mat-dialog-title>Sensor Details</h2>
    <mat-dialog-content>
      <p><strong>Type:</strong> {{ data.type }}</p>
      <p><strong>ID:</strong> {{ data.id }}</p>
      <p><strong>Zone:</strong> {{ data.area || 'Unknown' }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `
})
export class SensorDetailDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
