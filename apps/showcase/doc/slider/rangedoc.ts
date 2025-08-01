import { Code } from '@/domain/code';
import { Component } from '@angular/core';

@Component({
    selector: 'range-doc',
    standalone: false,
    template: `
        <app-docsectiontext>
            <p>When <i>range</i> property is present, slider provides two handles to define two values. In range mode, value should be an array instead of a single value.</p>
        </app-docsectiontext>
        <div class="card flex justify-center">
            <p-slider [(ngModel)]="rangeValues" [range]="true" class="w-56" />
        </div>
        <app-code [code]="code" selector="slider-range-demo"></app-code>
    `
})
export class RangeDoc {
    rangeValues: number[] = [20, 80];

    code: Code = {
        basic: `<p-slider [(ngModel)]="rangeValues" [range]="true" class="w-56" />`,

        html: `<div class="card flex justify-center">
    <p-slider [(ngModel)]="rangeValues" [range]="true" class="w-56" />
</div>`,

        typescript: `import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Slider } from 'primeng/slider';

@Component({
    selector: 'slider-range-demo',
    templateUrl: './slider-range-demo.html',
    standalone: true,
    imports: [FormsModule, Slider]
})
export class SliderRangeDemo {
    rangeValues: number[] = [20, 80];
}`
    };
}
