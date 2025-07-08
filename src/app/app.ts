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
import { MatDialog } from '@angular/material/dialog';
import { SensorDetailDialogComponent } from './sensor-detail-dialog/sensor-detail-dialog.component';

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
  @ViewChild('tooltipContainer') tooltipContainer!: ElementRef;

  sensorCtrl = new FormControl('');
  allSensors: string[] = [
    'Temperature Sensor',
    'Humidity Sensor',
    'Motion Sensor',
    'Smoke Detector',
    'Air Quality Sensor',
    'Light Sensor',
    'CO2 Sensor',
    'Water Leak Sensor',
    'Smart Plug',
    'Door Contact Sensor'
  ];
  filteredSensors!: Observable<string[]>;
  itemCount = 0;

  tooltipContent = '';
  tooltipX = 0;
  tooltipY = 0;
  tooltipVisible = false;

  dragPreviewVisible = false;
  dragX = 0;
  dragY = 0;
  dragPreviewType = '';

  constructor(private dialog: MatDialog) { }

  ngOnInit() {
    this.filteredSensors = this.sensorCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }

  ngAfterViewInit(): void {
    interact('.sensor-item').draggable({
      inertia: true,
      autoScroll: true,
      listeners: {
        move: () => { },
      }
    });
  }

  _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allSensors.filter(option => option.toLowerCase().includes(filterValue));
  }

  getSensorIcon(sensor: string): string {
    switch (sensor.toLowerCase()) {
      case 'temperature sensor': return 'device_thermostat';
      case 'humidity sensor': return 'water_drop';
      case 'motion sensor': return 'sensors';
      case 'smoke detector': return 'smoke_free';
      case 'air quality sensor': return 'air';
      case 'light sensor': return 'wb_incandescent';
      case 'co2 sensor': return 'cloud';
      case 'water leak sensor': return 'water_damage';
      case 'smart plug': return 'power';
      case 'door contact sensor': return 'sensor_door';
      default: return 'sensors';
    }
  }

  prepareDrag(sensor: string): void {
    this.dragPreviewType = sensor;
    this.dragPreviewVisible = true;
    window.addEventListener('mousemove', this.trackMouse);
    window.addEventListener('mouseup', this.stopDragPreview);
  }

  trackMouse = (event: MouseEvent): void => {
    this.dragX = event.clientX + 10;
    this.dragY = event.clientY + 10;
  };

  stopDragPreview = (): void => {
    this.dragPreviewVisible = false;
    window.removeEventListener('mousemove', this.trackMouse);
    window.removeEventListener('mouseup', this.stopDragPreview);
  };

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

  findContainingRoom(svgEl: SVGElement, x: number, y: number): SVGGElement | null {
    const groups = svgEl.querySelectorAll('[data-room]');
    for (const el of Array.from(groups)) {
      const bbox = (el as SVGGElement).getBBox();
      if (x >= bbox.x && x <= bbox.x + bbox.width && y >= bbox.y && y <= bbox.y + bbox.height) {
        return el as SVGGElement;
      }
    }
    return null;
  }

  placeSensor(type: string, cx: number, cy: number): void {
    const svgEl = this.svgContainer.nativeElement.querySelector('svg');
    if (!svgEl) return;

    const room = this.findContainingRoom(svgEl, cx, cy);
    if (!room) {
      alert('Please drop inside a valid room.');
      return;
    }

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

    icon.addEventListener('mouseenter', (e) => this.showTooltip(e, type));
    icon.addEventListener('mouseleave', () => this.hideTooltip());
    icon.addEventListener('click', () => {
      this.dialog.open(SensorDetailDialogComponent, {
        width: '300px',
        data: {
          id: icon.getAttribute('data-id'),
          type,
          area: room.getAttribute('data-room')
        }
      }).afterClosed().subscribe(result => {
        if (result?.delete) icon.remove();
      });
    });

    room.appendChild(icon);

    // Enable moving sensor again
    interact(icon).draggable({
      inertia: true,
      listeners: {
        move: (event) => {
          const x = (parseFloat(icon.getAttribute('x') || '0') || 0) + event.dx;
          const y = (parseFloat(icon.getAttribute('y') || '0') || 0) + event.dy;
          icon.setAttribute('x', x.toString());
          icon.setAttribute('y', y.toString());
        },
        end: (event) => {
          const point = this.getSVGCoordinates(event.clientX, event.clientY, svgEl);
          const newRoom = this.findContainingRoom(svgEl, point.x, point.y);
          if (newRoom) newRoom.appendChild(icon);
        }
      }
    });

    this.itemCount++;
  }

  showTooltip(event: MouseEvent, content: string): void {
    this.tooltipX = event.offsetX + 10;
    this.tooltipY = event.offsetY + 10;
    this.tooltipContent = content;
    this.tooltipVisible = true;
  }

  hideTooltip(): void {
    this.tooltipVisible = false;
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