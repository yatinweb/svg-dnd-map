import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import interact from 'interactjs';
import svgPanZoom from 'svg-pan-zoom';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  @ViewChild('svgContainer', { static: true }) svgContainer!: ElementRef<HTMLDivElement>;
  itemCount = 0;

  ngOnInit(): void {
    this.loadPositions();
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
        svgEl.removeAttribute('viewBox');
        svgPanZoom(svgEl, { zoomEnabled: true, controlIconsEnabled: true });
      }
    };
    reader.readAsText(file);
  }

  addItem(label: string, type: string): void {
    const el = document.createElement('div');
    el.className = 'draggable';
    el.innerText = label;
    el.id = `item-${this.itemCount++}`;
    el.setAttribute('data-name', label);
    el.setAttribute('data-type', type);
    el.style.top = `${50 + this.itemCount * 10}px`;
    el.style.left = `${50 + this.itemCount * 10}px`;
    this.svgContainer.nativeElement.appendChild(el);
    this.enableDrag(el);
  }

  enableDrag(el: HTMLElement): void {
    interact(el).draggable({
      modifiers: [
        interact.modifiers.snap({
          targets: [interact.snappers.grid({ x: 10, y: 10 })],
          range: Infinity,
          relativePoints: [{ x: 0.5, y: 0.5 }]
        })
      ],
      listeners: {
        move(event) {
          const target = event.target as any;
          const x = (parseFloat(target.dataset.x || '0') + event.dx);
          const y = (parseFloat(target.dataset.y || '0') + event.dy);
          target.style.transform = `translate(${x}px, ${y}px)`;
          target.dataset.x = x.toString();
          target.dataset.y = y.toString();
        },
        end: (event) => this.snapToSvgArea(event.target as HTMLElement)
      }
    });
  }

  snapToSvgArea(item: any): void {
    const svg = this.svgContainer.nativeElement.querySelector('svg');
    if (!svg) return;

    const rooms = svg.querySelectorAll('[id^=room], .zone, rect');
    const itemRect = item.getBoundingClientRect();

    rooms.forEach(room => {
      const roomRect = room.getBoundingClientRect();
      if (
        itemRect.left > roomRect.left &&
        itemRect.right < roomRect.right &&
        itemRect.top > roomRect.top &&
        itemRect.bottom < roomRect.bottom
      ) {
        const centerX = roomRect.left + roomRect.width / 2 - this.svgContainer.nativeElement.getBoundingClientRect().left;
        const centerY = roomRect.top + roomRect.height / 2 - this.svgContainer.nativeElement.getBoundingClientRect().top;
        const offsetX = centerX - item.offsetWidth / 2;
        const offsetY = centerY - item.offsetHeight / 2;
        item.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        item.dataset.x = offsetX.toString();
        item.dataset.y = offsetY.toString();
        item.dataset.room = (room as any).id || 'unknown';
      }
    });
  }

  savePositions(): void {
    const items = Array.from(this.svgContainer.nativeElement.querySelectorAll('.draggable')).map((el: any) => ({
      id: el.id,
      x: el.dataset.x,
      y: el.dataset.y,
      name: el.dataset.name,
      type: el.dataset.type,
      room: el.dataset.room
    }));
    localStorage.setItem('svg-items', JSON.stringify(items));
    alert('Positions saved!');
  }

  loadPositions(): void {
    const saved = JSON.parse(localStorage.getItem('svg-items') || '[]');
    saved.forEach((data: any) => {
      this.addItem(data.name, data.type);
      const item = document.getElementById(`item-${this.itemCount - 1}`);
      if (item) {
        item.setAttribute('data-x', data.x);
        item.setAttribute('data-y', data.y);
        item.setAttribute('data-room', data.room);
        item.style.transform = `translate(${data.x}px, ${data.y}px)`;
      }
    });
  }

  clearPositions(): void {
    localStorage.removeItem('svg-items');
    document.querySelectorAll('.draggable').forEach(el => el.remove());
  }
}
