import { Component, ViewChild, ElementRef } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Observable, startWith, map } from 'rxjs';
import interact from 'interactjs';
import svgPanZoom from 'svg-pan-zoom';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  @ViewChild('svgContainer', { static: true }) svgContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput', { static: true }) fileInput!: ElementRef<HTMLInputElement>;

  sensorCtrl = new FormControl();
  sensorList: string[] = ['Light', 'Humidity', 'Cold', 'Motion', 'Smoke'];
  filteredSensors!: Observable<string[]>;
  itemCount = 0;

  ngOnInit() {
    this.filteredSensors = this.sensorCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
    this.loadPositions();
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.sensorList.filter(option => option.toLowerCase().includes(filterValue));
  }

  onSVGUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.svgContainer.nativeElement.innerHTML = reader.result as string;

      const svgEl = this.svgContainer.nativeElement.querySelector('svg');
      if (svgEl) {
        svgEl.setAttribute('width', '100%');
        svgEl.setAttribute('height', '100%');
        svgPanZoom(svgEl, {
          zoomEnabled: true,
          controlIconsEnabled: true,
          fit: true,
          center: true
        });
      }
    };
    reader.readAsText(file);
  }

  addItem(type: string, cx = 100 + this.itemCount * 20, cy = 100 + this.itemCount * 20): void {
    const svgEl = this.svgContainer.nativeElement.querySelector('svg');
    if (!svgEl) {
      alert('No SVG loaded.');
      return;
    }

    const ns = 'http://www.w3.org/2000/svg';
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', cx.toString());
    circle.setAttribute('cy', cy.toString());
    circle.setAttribute('r', '12');
    circle.setAttribute('fill', '#3f51b5');
    circle.setAttribute('stroke', '#fff');
    circle.setAttribute('stroke-width', '2');
    circle.setAttribute('class', 'sensor draggable');
    circle.setAttribute('data-type', type);
    circle.setAttribute('data-id', `sensor-${this.itemCount}`);

    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', cx.toString());
    label.setAttribute('y', (cy + 5).toString());
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '10');
    label.setAttribute('fill', '#fff');
    label.setAttribute('data-id', `sensor-${this.itemCount}`);
    label.textContent = type;

    svgEl.appendChild(circle);
    svgEl.appendChild(label);

    this.itemCount++;
    this.enableDragForSVGElements();
  }

  enableDragForSVGElements(): void {
    interact('.draggable').draggable({
      listeners: {
        move(event) {
          const target = event.target;
          const dx = event.dx;
          const dy = event.dy;

          const cx = parseFloat(target.getAttribute('cx') || '0');
          const cy = parseFloat(target.getAttribute('cy') || '0');

          target.setAttribute('cx', (cx + dx).toString());
          target.setAttribute('cy', (cy + dy).toString());

          const id = target.getAttribute('data-id');
          const label = target.ownerSVGElement?.querySelector(`text[data-id="${id}"]`);
          if (label) {
            label.setAttribute('x', (cx + dx).toString());
            label.setAttribute('y', (cy + dy + 5).toString());
          }
        }
      }
    });
  }

  savePositions(): void {
    const svg = this.svgContainer.nativeElement.querySelector('svg');
    const sensors = svg?.querySelectorAll('circle.sensor');

    const data = Array.from(sensors || []).map((el: Element) => ({
      id: el.getAttribute('data-id'),
      type: el.getAttribute('data-type'),
      cx: el.getAttribute('cx'),
      cy: el.getAttribute('cy')
    }));

    localStorage.setItem('sensors', JSON.stringify(data));
  }

  loadPositions(): void {
    const data = localStorage.getItem('sensors');
    if (data) {
      JSON.parse(data).forEach((sensor: any) => {
        this.addItem(sensor.type, parseFloat(sensor.cx), parseFloat(sensor.cy));
      });
    }
  }
  clearPositions(): void {
    localStorage.removeItem('svg-items');
    document.querySelectorAll('.draggable').forEach(el => el.remove());
  }
}
