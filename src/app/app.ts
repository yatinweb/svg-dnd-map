import { Component, ViewChild, ElementRef } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
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
    MatTooltipModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  @ViewChild('svgContainer', { static: true }) svgContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput', { static: true }) fileInput!: ElementRef<HTMLInputElement>;

  sensorCtrl = new FormControl('');
  allSensors: string[] = ['Chair', 'AC', 'Light', 'Fan', 'CCTV'];
  filteredSensors!: Observable<string[]>;
  itemCount = 0;

  ngOnInit() {
    this.filteredSensors = this.sensorCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allSensors.filter(option => option.toLowerCase().includes(filterValue));
  }

  getSensorIcon(sensor: string): string {
    switch (sensor.toLowerCase()) {
      case 'chair': return 'event_seat';
      case 'ac': return 'ac_unit';
      case 'light': return 'lightbulb';
      case 'fan': return 'air';
      case 'cctv': return 'videocam';
      default: return 'device_unknown';
    }
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
        this.enableDrop(svgEl);
      }
    };
    reader.readAsText(file);
  }

  prepareDrag(sensor: string): void {
    // Drag is now handled globally in ngAfterViewInit
  }

  ngAfterViewInit(): void {
    interact('.sensor-item').draggable({
      inertia: true,
      autoScroll: true,
      listeners: {
        move: () => {
          // Optional: no DOM changes here to avoid duplicate icons
        }
      }
    });
  }

  enableDrop(svgEl: SVGElement): void {
    interact(svgEl).dropzone({
      accept: '.sensor-item',
      ondrop: (event: any) => {
        const sensorType = event.relatedTarget.getAttribute('data-type');
        const point = this.getSVGCoordinates(event.dragEvent.clientX, event.dragEvent.clientY, svgEl);
        this.placeSensor(sensorType, point.x, point.y);
      }
    });
  }

  getSVGCoordinates(clientX: number, clientY: number, svgEl: SVGElement): { x: number, y: number } {
    const svgGraphicsEl = svgEl as unknown as SVGGraphicsElement;
    const svgRoot = svgGraphicsEl.ownerSVGElement || (svgGraphicsEl as SVGSVGElement);
    const pt = svgRoot.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;

    const ctm = svgGraphicsEl.getScreenCTM();
    if (ctm) {
      return pt.matrixTransform(ctm.inverse());
    }
    return { x: 0, y: 0 };
  }

  placeSensor(type: string, cx: number, cy: number): void {
    const svgEl = this.svgContainer.nativeElement.querySelector('svg');
    if (!svgEl) return;

    const ns = 'http://www.w3.org/2000/svg';
    const icon = document.createElementNS(ns, 'text');
    icon.setAttribute('x', cx.toString());
    icon.setAttribute('y', cy.toString());
    icon.setAttribute('font-family', 'Material Icons');
    icon.setAttribute('font-size', '24');
    icon.setAttribute('fill', '#3f51b5');
    icon.textContent = this.getSensorIcon(type);
    icon.setAttribute('data-type', type);
    icon.setAttribute('data-id', 'sensor-' + this.itemCount);
    icon.setAttribute('class', 'sensor-icon');
    icon.setAttribute('title', type);
    svgEl.appendChild(icon);
    this.itemCount++;
  }

  savePositions(): void {
    const svg = this.svgContainer.nativeElement.querySelector('svg');
    const items = svg?.querySelectorAll('.sensor-icon') || [];
    const data = Array.from(items).map(el => ({
      id: el.getAttribute('data-id'),
      type: el.getAttribute('data-type'),
      x: el.getAttribute('x'),
      y: el.getAttribute('y')
    }));
    localStorage.setItem('sensors', JSON.stringify(data));
  }

  clearAll(): void {
    const svg = this.svgContainer.nativeElement.querySelector('svg');
    const items = svg?.querySelectorAll('.sensor-icon') || [];
    items.forEach(el => el.remove());
    localStorage.removeItem('sensors');
  }
}
