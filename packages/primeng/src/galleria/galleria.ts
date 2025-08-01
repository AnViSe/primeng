import { animate, AnimationEvent, style, transition, trigger } from '@angular/animations';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
    AfterContentChecked,
    AfterViewInit,
    booleanAttribute,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ContentChild,
    ContentChildren,
    DoCheck,
    ElementRef,
    EventEmitter,
    HostListener,
    Inject,
    inject,
    Input,
    KeyValueDiffers,
    NgModule,
    numberAttribute,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    PLATFORM_ID,
    QueryList,
    SimpleChanges,
    TemplateRef,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { addClass, find, findSingle, focus, getAttribute, removeClass, setAttribute, uuid } from '@primeuix/utils';
import { PrimeTemplate, SharedModule } from 'primeng/api';
import { BaseComponent } from 'primeng/basecomponent';
import { blockBodyScroll, unblockBodyScroll } from 'primeng/dom';
import { FocusTrap } from 'primeng/focustrap';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, TimesIcon } from 'primeng/icons';
import { Ripple } from 'primeng/ripple';
import { VoidListener } from 'primeng/ts-helpers';
import { ZIndexUtils } from 'primeng/utils';
import { GalleriaResponsiveOptions } from './galleria.interface';
import { GalleriaStyle } from './style/galleriastyle';

/**
 * Galleria is an advanced content gallery component.
 * @group Components
 */
@Component({
    selector: 'p-galleria',
    standalone: false,
    template: `
        <div *ngIf="fullScreen; else windowed" #container>
            <div *ngIf="maskVisible" #mask [ngClass]="cx('mask')" [class]="maskClass" [attr.role]="fullScreen ? 'dialog' : 'region'" [attr.aria-modal]="fullScreen ? 'true' : undefined" (click)="onMaskHide($event)">
                <p-galleriaContent
                    *ngIf="visible"
                    [@animation]="{
                        value: 'visible',
                        params: { showTransitionParams: showTransitionOptions, hideTransitionParams: hideTransitionOptions }
                    }"
                    (@animation.start)="onAnimationStart($event)"
                    (@animation.done)="onAnimationEnd($event)"
                    [value]="value"
                    [activeIndex]="activeIndex"
                    [numVisible]="numVisibleLimit || numVisible"
                    (maskHide)="onMaskHide()"
                    (activeItemChange)="onActiveItemChange($event)"
                    [ngStyle]="containerStyle"
                    [fullScreen]="fullScreen"
                ></p-galleriaContent>
            </div>
        </div>

        <ng-template #windowed>
            <p-galleriaContent [value]="value" [activeIndex]="activeIndex" [numVisible]="numVisibleLimit || numVisible" (activeItemChange)="onActiveItemChange($event)"></p-galleriaContent>
        </ng-template>
    `,
    animations: [
        trigger('animation', [
            transition('void => visible', [style({ transform: 'scale(0.7)', opacity: 0 }), animate('{{showTransitionParams}}')]),
            transition('visible => void', [animate('{{hideTransitionParams}}', style({ transform: 'scale(0.7)', opacity: 0 }))])
        ])
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [GalleriaStyle]
})
export class Galleria extends BaseComponent implements OnChanges, OnDestroy {
    /**
     * Index of the first item.
     * @group Props
     */
    @Input() get activeIndex(): number {
        return this._activeIndex;
    }
    set activeIndex(activeIndex) {
        this._activeIndex = activeIndex;
    }
    /**
     * Whether to display the component on fullscreen.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) fullScreen: boolean = false;
    /**
     * Unique identifier of the element.
     * @group Props
     */
    @Input() id: string | undefined;
    /**
     * An array of objects to display.
     * @group Props
     */
    @Input() value: any[] | undefined;
    /**
     * Number of items per page.
     * @group Props
     */
    @Input({ transform: numberAttribute }) numVisible: number = 3;
    /**
     * An array of options for responsive design.
     * @see {GalleriaResponsiveOptions}
     * @group Props
     */
    @Input() responsiveOptions: GalleriaResponsiveOptions[] | undefined;
    /**
     * Whether to display navigation buttons in item section.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) showItemNavigators: boolean = false;
    /**
     * Whether to display navigation buttons in thumbnail container.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) showThumbnailNavigators: boolean = true;
    /**
     * Whether to display navigation buttons on item hover.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) showItemNavigatorsOnHover: boolean = false;
    /**
     * When enabled, item is changed on indicator hover.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) changeItemOnIndicatorHover: boolean = false;
    /**
     * Defines if scrolling would be infinite.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) circular: boolean = false;
    /**
     * Items are displayed with a slideshow in autoPlay mode.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) autoPlay: boolean = false;
    /**
     * When enabled, autorun should stop by click.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) shouldStopAutoplayByClick: boolean = true;
    /**
     * Time in milliseconds to scroll items.
     * @group Props
     */
    @Input({ transform: numberAttribute }) transitionInterval: number = 4000;
    /**
     * Whether to display thumbnail container.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) showThumbnails: boolean = true;
    /**
     * Position of thumbnails.
     * @group Props
     */
    @Input() thumbnailsPosition: 'bottom' | 'top' | 'left' | 'right' | undefined = 'bottom';
    /**
     * Height of the viewport in vertical thumbnail.
     * @group Props
     */
    @Input() verticalThumbnailViewPortHeight: string = '300px';
    /**
     * Whether to display indicator container.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) showIndicators: boolean = false;
    /**
     * When enabled, indicator container is displayed on item container.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) showIndicatorsOnItem: boolean = false;
    /**
     * Position of indicators.
     * @group Props
     */
    @Input() indicatorsPosition: 'bottom' | 'top' | 'left' | 'right' | undefined = 'bottom';
    /**
     * Base zIndex value to use in layering.
     * @group Props
     */
    @Input({ transform: numberAttribute }) baseZIndex: number = 0;
    /**
     * Style class of the mask on fullscreen mode.
     * @group Props
     */
    @Input() maskClass: string | undefined;
    /**
     * Style class of the component on fullscreen mode. Otherwise, the 'class' property can be used.
     * @group Props
     */
    @Input() containerClass: string | undefined;
    /**
     * Inline style of the component on fullscreen mode. Otherwise, the 'style' property can be used.
     * @group Props
     */
    @Input() containerStyle: { [klass: string]: any } | null | undefined;
    /**
     * Transition options of the show animation.
     * @group Props
     */
    @Input() showTransitionOptions: string = '150ms cubic-bezier(0, 0, 0.2, 1)';
    /**
     * Transition options of the hide animation.
     * @group Props
     */
    @Input() hideTransitionOptions: string = '150ms cubic-bezier(0, 0, 0.2, 1)';
    /**
     * Specifies the visibility of the mask on fullscreen mode.
     * @group Props
     */
    @Input() get visible(): boolean {
        return this._visible;
    }
    set visible(visible: boolean) {
        this._visible = visible;

        if (this._visible && !this.maskVisible) {
            this.maskVisible = true;
        }
    }
    /**
     * Callback to invoke on active index change.
     * @param {number} number - Active index.
     * @group Emits
     */
    @Output() activeIndexChange: EventEmitter<number> = new EventEmitter<number>();
    /**
     * Callback to invoke on visiblity change.
     * @param {boolean} boolean - Visible value.
     * @group Emits
     */
    @Output() visibleChange: EventEmitter<boolean> = new EventEmitter<boolean>();

    @ViewChild('mask') mask: ElementRef | undefined;

    @ViewChild('container') container: ElementRef | undefined;

    _visible: boolean = false;

    _activeIndex: number = 0;

    @ContentChild('header', { descendants: false }) headerTemplate: TemplateRef<any> | undefined;
    headerFacet: any;

    @ContentChild('footer', { descendants: false, static: false }) footerTemplate: TemplateRef<any> | undefined;
    footerFacet: any;

    @ContentChild('indicator', { descendants: false }) indicatorTemplate: TemplateRef<any> | undefined;
    indicatorFacet: any;

    @ContentChild('caption', { descendants: false }) captionTemplate: TemplateRef<any> | undefined;
    captionFacet: any;

    @ContentChild('closeicon', { descendants: false }) _closeIconTemplate: TemplateRef<any> | undefined;
    closeIconTemplate: TemplateRef<any> | undefined;

    @ContentChild('previousthumbnailicon', { descendants: false }) _previousThumbnailIconTemplate: TemplateRef<any> | undefined;
    previousThumbnailIconTemplate: TemplateRef<any> | undefined;

    @ContentChild('nextthumbnailicon', { descendants: false }) _nextThumbnailIconTemplate: TemplateRef<any> | undefined;
    nextThumbnailIconTemplate: TemplateRef<any> | undefined;

    @ContentChild('itempreviousicon', { descendants: false }) _itemPreviousIconTemplate: TemplateRef<any> | undefined;
    itemPreviousIconTemplate: TemplateRef<any> | undefined;

    @ContentChild('itemnexticon', { descendants: false }) _itemNextIconTemplate: TemplateRef<any> | undefined;
    itemNextIconTemplate: TemplateRef<any> | undefined;

    @ContentChild('item', { descendants: false }) _itemTemplate: TemplateRef<any> | undefined;
    itemTemplate: TemplateRef<any> | undefined;

    @ContentChild('thumbnail', { descendants: false, static: false }) _thumbnailTemplate: TemplateRef<any> | undefined;
    thumbnailTemplate: TemplateRef<any> | undefined;

    maskVisible: boolean = false;

    numVisibleLimit = 0;

    _componentStyle = inject(GalleriaStyle);

    constructor(
        @Inject(PLATFORM_ID) public platformId: any,
        public element: ElementRef,
        public cd: ChangeDetectorRef
    ) {
        super();
    }

    @ContentChildren(PrimeTemplate) templates: QueryList<PrimeTemplate> | undefined;

    ngAfterContentInit() {
        this.templates?.forEach((item) => {
            switch (item.getType()) {
                case 'header':
                    this.headerFacet = item.template;
                    break;

                case 'footer':
                    this.footerFacet = item.template;
                    break;

                case 'indicator':
                    this.indicatorFacet = item.template;
                    break;

                case 'closeicon':
                    this.closeIconTemplate = item.template;
                    break;

                case 'itemnexticon':
                    this.itemNextIconTemplate = item.template;
                    break;

                case 'itempreviousicon':
                    this.itemPreviousIconTemplate = item.template;
                    break;

                case 'previousthumbnailicon':
                    this.previousThumbnailIconTemplate = item.template;
                    break;

                case 'nextthumbnailicon':
                    this.nextThumbnailIconTemplate = item.template;
                    break;

                case 'caption':
                    this.captionFacet = item.template;
                    break;

                case 'item':
                    this.itemTemplate = item.template;
                    break;

                case 'thumbnail':
                    this.thumbnailTemplate = item.template;
                    break;
            }
        });
    }

    ngOnChanges(simpleChanges: SimpleChanges) {
        super.ngOnChanges(simpleChanges);
        if (simpleChanges.value && simpleChanges.value.currentValue?.length < this.numVisible) {
            this.numVisibleLimit = simpleChanges.value.currentValue.length;
        } else {
            this.numVisibleLimit = 0;
        }
    }

    onMaskHide(event?: MouseEvent) {
        if (!event || event.target === event.currentTarget) {
            this.visible = false;
            this.visibleChange.emit(false);
        }
    }

    onActiveItemChange(index: number) {
        if (this.activeIndex !== index) {
            this.activeIndex = index;
            this.activeIndexChange.emit(index);
        }
    }

    onAnimationStart(event: AnimationEvent) {
        switch (event.toState) {
            case 'visible':
                this.enableModality();
                setTimeout(() => {
                    focus(<any>findSingle(this.container.nativeElement, '[data-pc-section="closebutton"]'));
                }, 25);
                break;

            case 'void':
                addClass(this.mask?.nativeElement, 'p-overlay-mask-leave');
                break;
        }
    }

    onAnimationEnd(event: AnimationEvent) {
        switch (event.toState) {
            case 'void':
                this.disableModality();
                break;
        }
    }

    enableModality() {
        blockBodyScroll();
        this.cd.markForCheck();

        if (this.mask) {
            ZIndexUtils.set('modal', this.mask.nativeElement, this.baseZIndex || this.config.zIndex.modal);
        }
    }

    disableModality() {
        unblockBodyScroll();
        this.maskVisible = false;
        this.cd.markForCheck();

        if (this.mask) {
            ZIndexUtils.clear(this.mask.nativeElement);
        }
    }

    ngOnDestroy() {
        if (this.fullScreen) {
            removeClass(this.document.body, 'p-overflow-hidden');
        }

        if (this.mask) {
            this.disableModality();
        }
    }
}

@Component({
    selector: 'p-galleriaContent',
    standalone: false,
    template: `
        <div [attr.id]="id" [attr.role]="'region'" *ngIf="value && value.length > 0" [class]="cn(cx('root'), galleria.containerClass)" [ngStyle]="!galleria.fullScreen ? galleria.containerStyle : {}" pFocusTrap [pFocusTrapDisabled]="!fullScreen">
            <button *ngIf="galleria.fullScreen" type="button" [class]="cx('closeButton')" (click)="maskHide.emit()" [attr.aria-label]="closeAriaLabel()" [attr.data-pc-section]="'closebutton'">
                <svg data-p-icon="times" *ngIf="!galleria.closeIconTemplate && !galleria._closeIconTemplate" [class]="cx('closeIcon')" />
                <ng-template *ngTemplateOutlet="galleria.closeIconTemplate || galleria._closeIconTemplate"></ng-template>
            </button>
            <div *ngIf="galleria.templates && (galleria.headerFacet || galleria.headerTemplate)" [class]="cx('header')">
                <p-galleriaItemSlot type="header" [templates]="galleria.templates"></p-galleriaItemSlot>
            </div>
            <div [class]="cx('content')" [attr.aria-live]="galleria.autoPlay ? 'polite' : 'off'">
                <p-galleriaItem
                    [id]="id"
                    [value]="value"
                    [activeIndex]="activeIndex"
                    [circular]="galleria.circular"
                    [templates]="galleria.templates"
                    (onActiveIndexChange)="onActiveIndexChange($event)"
                    [showIndicators]="galleria.showIndicators"
                    [changeItemOnIndicatorHover]="galleria.changeItemOnIndicatorHover"
                    [indicatorFacet]="galleria.indicatorFacet"
                    [captionFacet]="galleria.captionFacet"
                    [showItemNavigators]="galleria.showItemNavigators"
                    [autoPlay]="galleria.autoPlay"
                    [slideShowActive]="slideShowActive"
                    (startSlideShow)="startSlideShow()"
                    (stopSlideShow)="stopSlideShow()"
                ></p-galleriaItem>

                <p-galleriaThumbnails
                    *ngIf="galleria.showThumbnails"
                    [containerId]="id"
                    [value]="value"
                    (onActiveIndexChange)="onActiveIndexChange($event)"
                    [activeIndex]="activeIndex"
                    [templates]="galleria.templates"
                    [numVisible]="numVisible"
                    [responsiveOptions]="galleria.responsiveOptions"
                    [circular]="galleria.circular"
                    [isVertical]="isVertical()"
                    [contentHeight]="galleria.verticalThumbnailViewPortHeight"
                    [showThumbnailNavigators]="galleria.showThumbnailNavigators"
                    [slideShowActive]="slideShowActive"
                    (stopSlideShow)="stopSlideShow()"
                ></p-galleriaThumbnails>
            </div>
            <div *ngIf="shouldRenderFooter()" [class]="cx('footer')">
                <p-galleriaItemSlot type="footer" [templates]="galleria.templates"></p-galleriaItemSlot>
            </div>
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [GalleriaStyle]
})
export class GalleriaContent extends BaseComponent implements DoCheck {
    @Input() get activeIndex(): number {
        return this._activeIndex;
    }
    set activeIndex(activeIndex: number) {
        this._activeIndex = activeIndex;
    }

    @Input() value: any[] = [];

    @Input({ transform: numberAttribute }) numVisible: number | undefined;

    @Input({ transform: booleanAttribute }) fullScreen: boolean;

    @Output() maskHide: EventEmitter<boolean> = new EventEmitter();

    @Output() activeItemChange: EventEmitter<number> = new EventEmitter();

    @ViewChild('closeButton') closeButton: ElementRef | undefined;

    _componentStyle = inject(GalleriaStyle);

    id: string;

    _activeIndex: number = 0;

    slideShowActive: boolean = true;

    interval: any;

    styleClass: string | undefined;

    private differ: any;

    constructor(
        public galleria: Galleria,
        public cd: ChangeDetectorRef,
        private differs: KeyValueDiffers,
        private elementRef: ElementRef
    ) {
        super();
        this.id = this.galleria.id || uuid('pn_id_');
        this.differ = this.differs.find(this.galleria).create();
    }

    // For custom fullscreen
    @HostListener('document:fullscreenchange', ['$event'])
    handleFullscreenChange(event: Event) {
        if (document?.fullscreenElement === this.elementRef.nativeElement?.children[0]) {
            this.fullScreen = true;
        } else {
            this.fullScreen = false;
        }
    }

    ngDoCheck(): void {
        if (isPlatformBrowser(this.galleria.platformId)) {
            const changes = this.differ.diff(this.galleria as unknown as Record<string, unknown>);
            if (changes && changes.forEachItem.length > 0) {
                // Because we change the properties of the parent component,
                // and the children take our entity from the injector.
                // We can tell the children to redraw themselves when we change the properties of the parent component.
                // Since we have an onPush strategy
                this.cd.markForCheck();
            }
        }
    }

    shouldRenderFooter() {
        return (this.galleria.footerFacet && this.galleria.templates.toArray().length > 0) || this.galleria.footerTemplate;
    }

    startSlideShow() {
        if (isPlatformBrowser(this.galleria.platformId)) {
            this.interval = setInterval(() => {
                let activeIndex = this.galleria.circular && this.value.length - 1 === this.activeIndex ? 0 : this.activeIndex + 1;
                this.onActiveIndexChange(activeIndex);
                this.activeIndex = activeIndex;
            }, this.galleria.transitionInterval);

            this.slideShowActive = true;
        }
    }

    stopSlideShow() {
        if (this.galleria.autoPlay && !this.galleria.shouldStopAutoplayByClick) {
            return;
        }

        if (this.interval) {
            clearInterval(this.interval);
        }

        this.slideShowActive = false;
    }

    getPositionClass(preClassName: string, position: string) {
        const positions = ['top', 'left', 'bottom', 'right'];
        const pos = positions.find((item) => item === position);

        return pos ? `${preClassName}-${pos}` : '';
    }

    isVertical() {
        return this.galleria.thumbnailsPosition === 'left' || this.galleria.thumbnailsPosition === 'right';
    }

    onActiveIndexChange(index: number) {
        if (this.activeIndex !== index) {
            this.activeIndex = index;
            this.activeItemChange.emit(this.activeIndex);
        }
    }

    closeAriaLabel() {
        return this.config.translation.aria ? this.config.translation.aria.close : undefined;
    }
}

@Component({
    selector: 'p-galleriaItemSlot',
    standalone: false,
    template: `
        <ng-container *ngIf="shouldRender()">
            <ng-container *ngTemplateOutlet="contentTemplate; context: context"></ng-container>
        </ng-container>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GalleriaItemSlot {
    @Input() templates: QueryList<PrimeTemplate> | undefined;

    @Input({ transform: numberAttribute }) index: number | undefined;

    @Input() get item(): any {
        return this._item;
    }

    shouldRender() {
        return (
            this.contentTemplate ||
            this.galleria._itemTemplate ||
            this.galleria.itemTemplate ||
            this.galleria.captionTemplate ||
            this.galleria.captionTemplate ||
            this.galleria.captionFacet ||
            this.galleria.thumbnailTemplate ||
            this.galleria._thumbnailTemplate ||
            this.galleria.footerTemplate
        );
    }

    galleria: Galleria = inject(Galleria);

    set item(item: any) {
        this._item = item;
        if (this.templates && this.templates?.toArray().length > 0) {
            this.templates.forEach((item) => {
                if (item.getType() === this.type) {
                    switch (this.type) {
                        case 'item':
                        case 'caption':
                        case 'thumbnail':
                            this.context = { $implicit: this.item };
                            this.contentTemplate = item.template;
                            break;
                        case 'footer':
                            this.context = { $implicit: this.item };
                            this.contentTemplate = item.template;
                            break;
                    }
                }
            });
        } else {
            this.getContentTemplate();
        }
    }

    getContentTemplate() {
        switch (this.type) {
            case 'item':
                this.context = { $implicit: this.item };
                this.contentTemplate = this.galleria._itemTemplate || this.galleria.itemTemplate;
                break;
            case 'caption':
                this.context = { $implicit: this.item };
                this.contentTemplate = this.galleria.captionTemplate || this.galleria.captionFacet;
                break;
            case 'thumbnail':
                this.context = { $implicit: this.item };
                this.contentTemplate = this.galleria.thumbnailTemplate || this.galleria._thumbnailTemplate;
                break;
            case 'indicator':
                this.context = { $implicit: this.index };
                this.contentTemplate = this.galleria.indicatorTemplate || this.galleria.indicatorFacet;
                break;
            case 'footer':
                this.context = { $implicit: this.item };
                this.contentTemplate = this.galleria.footerTemplate || this.galleria.footerFacet;
                break;
            default:
                this.context = { $implicit: this.item };
                this.contentTemplate = this.galleria._itemTemplate || this.galleria.itemTemplate;
        }
    }

    @Input() type: string | undefined;

    contentTemplate: TemplateRef<any> | undefined;

    context: any;

    _item: any;

    ngAfterContentInit() {
        if (this.templates && this.templates.toArray().length > 0) {
            this.templates?.forEach((item) => {
                if (item.getType() === this.type) {
                    switch (this.type) {
                        case 'item':
                        case 'caption':
                        case 'thumbnail':
                            this.context = { $implicit: this.item };
                            this.contentTemplate = item.template;
                            break;

                        case 'indicator':
                            this.context = { $implicit: this.index };
                            this.contentTemplate = item.template;
                            break;

                        case 'footer':
                            this.context = { $implicit: this.item };
                            this.contentTemplate = item.template;
                            break;

                        default:
                            this.context = { $implicit: this.item };
                            this.contentTemplate = item.template;
                            break;
                    }
                }
            });
        } else {
            this.getContentTemplate();
        }
    }
}

@Component({
    selector: 'p-galleriaItem',
    standalone: false,
    template: `
        <div [class]="cx('items')">
            <button *ngIf="showItemNavigators" type="button" role="navigation" [class]="cx('prevButton')" (click)="navBackward($event)" (focus)="onButtonFocus('left')" (blur)="onButtonBlur('left')">
                <svg data-p-icon="chevron-left" *ngIf="!galleria.itemPreviousIconTemplate && !galleria._itemPreviousIconTemplate" [class]="cx('prevIcon')" />
                <ng-template *ngTemplateOutlet="galleria.itemPreviousIconTemplate || galleria._itemPreviousIconTemplate"></ng-template>
            </button>
            <div [id]="id + '_item_' + activeIndex" role="group" [class]="cx('item')" [attr.aria-label]="ariaSlideNumber(activeIndex + 1)" [attr.aria-roledescription]="ariaSlideLabel()">
                <p-galleriaItemSlot type="item" [item]="activeItem" [templates]="templates" [class]="cx('item')"></p-galleriaItemSlot>
            </div>
            <button *ngIf="showItemNavigators" type="button" [class]="cx('nextButton')" (click)="navForward($event)" role="navigation" (focus)="onButtonFocus('right')" (blur)="onButtonBlur('right')">
                <svg data-p-icon="chevron-right" *ngIf="!galleria.itemNextIconTemplate && !galleria._itemNextIconTemplate" [class]="cx('nextIcon')" />
                <ng-template *ngTemplateOutlet="galleria.itemNextIconTemplate || galleria._itemNextIconTemplate"></ng-template>
            </button>
            <div [class]="cx('caption')" *ngIf="captionFacet || galleria.captionTemplate">
                <p-galleriaItemSlot type="caption" [item]="activeItem" [templates]="templates"></p-galleriaItemSlot>
            </div>
        </div>
        <ul *ngIf="showIndicators" [class]="cx('indicatorList')">
            <li
                *ngFor="let item of value; let index = index"
                tabindex="0"
                (click)="onIndicatorClick(index)"
                (mouseenter)="onIndicatorMouseEnter(index)"
                (keydown)="onIndicatorKeyDown($event, index)"
                [class]="cx('indicator', { index })"
                [attr.aria-label]="ariaPageLabel(index + 1)"
                [attr.aria-selected]="activeIndex === index"
                [attr.aria-controls]="id + '_item_' + index"
            >
                <button type="button" tabIndex="-1" [class]="cx('indicatorButton')" *ngIf="!indicatorFacet && !galleria.indicatorTemplate"></button>
                <p-galleriaItemSlot type="indicator" [index]="index" [templates]="templates"></p-galleriaItemSlot>
            </li>
        </ul>
    `,
    host: {
        '[class]': "cx('itemsContainer')"
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [GalleriaStyle]
})
export class GalleriaItem extends BaseComponent implements OnChanges {
    @Input() id: string | undefined;

    @Input({ transform: booleanAttribute }) circular: boolean = false;

    @Input() value: any[] | undefined;

    @Input({ transform: booleanAttribute }) showItemNavigators: boolean = false;

    @Input({ transform: booleanAttribute }) showIndicators: boolean = true;

    @Input({ transform: booleanAttribute }) slideShowActive: boolean = true;

    @Input({ transform: booleanAttribute }) changeItemOnIndicatorHover: boolean = true;

    @Input({ transform: booleanAttribute }) autoPlay: boolean = false;

    @Input() templates: QueryList<PrimeTemplate> | undefined;

    @Input() indicatorFacet: any;

    @Input() captionFacet: any;

    @Output() startSlideShow: EventEmitter<Event> = new EventEmitter();

    @Output() stopSlideShow: EventEmitter<Event> = new EventEmitter();

    @Output() onActiveIndexChange: EventEmitter<number> = new EventEmitter();

    _componentStyle = inject(GalleriaStyle);

    @Input() get activeIndex(): number {
        return this._activeIndex;
    }

    set activeIndex(activeIndex) {
        this._activeIndex = activeIndex;
    }

    get activeItem() {
        return this.value && this.value[this._activeIndex];
    }

    _activeIndex: number = 0;

    leftButtonFocused: boolean = false;

    rightButtonFocused: boolean = false;

    constructor(public galleria: Galleria) {
        super();
    }

    ngOnChanges({ autoPlay }: SimpleChanges): void {
        super.ngOnChanges({ autoPlay });
        if (autoPlay?.currentValue) {
            this.startSlideShow.emit();
        }

        if (autoPlay && autoPlay.currentValue === false) {
            this.stopTheSlideShow();
        }
    }

    next() {
        let nextItemIndex = this.activeIndex + 1;
        let activeIndex = this.circular && (<any[]>this.value).length - 1 === this.activeIndex ? 0 : nextItemIndex;
        this.onActiveIndexChange.emit(activeIndex);
    }

    prev() {
        let prevItemIndex = this.activeIndex !== 0 ? this.activeIndex - 1 : 0;
        let activeIndex = this.circular && this.activeIndex === 0 ? (<any[]>this.value).length - 1 : prevItemIndex;
        this.onActiveIndexChange.emit(activeIndex);
    }

    onButtonFocus(pos: 'left' | 'right') {
        if (pos === 'left') {
            this.leftButtonFocused = true;
        } else this.rightButtonFocused = true;
    }

    onButtonBlur(pos: 'left' | 'right') {
        if (pos === 'left') {
            this.leftButtonFocused = false;
        } else this.rightButtonFocused = false;
    }

    stopTheSlideShow() {
        if (this.slideShowActive && this.stopSlideShow) {
            this.stopSlideShow.emit();
        }
    }

    navForward(e: MouseEvent) {
        this.stopTheSlideShow();
        this.next();

        if (e && e.cancelable) {
            e.preventDefault();
        }
    }

    navBackward(e: MouseEvent) {
        this.stopTheSlideShow();
        this.prev();

        if (e && e.cancelable) {
            e.preventDefault();
        }
    }

    onIndicatorClick(index: number) {
        this.stopTheSlideShow();
        this.onActiveIndexChange.emit(index);
    }

    onIndicatorMouseEnter(index: number) {
        if (this.changeItemOnIndicatorHover) {
            this.stopTheSlideShow();
            this.onActiveIndexChange.emit(index);
        }
    }

    onIndicatorKeyDown(event, index: number) {
        switch (event.code) {
            case 'Enter':
            case 'Space':
                this.stopTheSlideShow();
                this.onActiveIndexChange.emit(index);
                event.preventDefault();
                break;

            case 'ArrowDown':
            case 'ArrowUp':
                event.preventDefault();
                break;

            default:
                break;
        }
    }

    isNavForwardDisabled() {
        return !this.circular && this.activeIndex === (<any[]>this.value).length - 1;
    }

    isNavBackwardDisabled() {
        return !this.circular && this.activeIndex === 0;
    }

    isIndicatorItemActive(index: number) {
        return this.activeIndex === index;
    }

    ariaSlideLabel() {
        return this.galleria.config.translation.aria ? this.galleria.config.translation.aria.slide : undefined;
    }

    ariaSlideNumber(value) {
        return this.galleria.config.translation.aria ? this.galleria.config.translation.aria.slideNumber.replace(/{slideNumber}/g, value) : undefined;
    }

    ariaPageLabel(value) {
        return this.galleria.config.translation.aria ? this.galleria.config.translation.aria.pageLabel.replace(/{page}/g, value) : undefined;
    }
}

@Component({
    selector: 'p-galleriaThumbnails',
    standalone: false,
    template: `
        <div [class]="cx('thumbnails')">
            <div [class]="cx('thumbnailContent')">
                <button *ngIf="showThumbnailNavigators" type="button" [class]="cx('thumbnailPrevButton')" (click)="navBackward($event)" pRipple [attr.aria-label]="ariaPrevButtonLabel()">
                    <ng-container *ngIf="!galleria.previousThumbnailIconTemplate && !galleria._previousThumbnailIconTemplate">
                        <svg data-p-icon="chevron-left" *ngIf="!isVertical" [class]="cx('thumbnailPrevIcon')" />
                        <svg data-p-icon="chevron-up" *ngIf="isVertical" [class]="cx('thumbnailPrevIcon')" />
                    </ng-container>
                    <ng-template *ngTemplateOutlet="galleria.previousThumbnailIconTemplate || galleria._previousThumbnailIconTemplate"></ng-template>
                </button>
                <div [class]="cx('thumbnailsViewport')" [ngStyle]="{ height: isVertical ? contentHeight : '' }">
                    <div #itemsContainer [class]="cx('thumbnailItems')" (transitionend)="onTransitionEnd()" (touchstart)="onTouchStart($event)" (touchmove)="onTouchMove($event)" role="tablist">
                        <div
                            *ngFor="let item of value; let index = index"
                            [class]="cx('thumbnailItem', { index, activeIndex })"
                            [attr.aria-selected]="activeIndex === index"
                            [attr.aria-controls]="containerId + '_item_' + index"
                            [attr.data-pc-section]="'thumbnailitem'"
                            [attr.data-p-active]="activeIndex === index"
                            (keydown)="onThumbnailKeydown($event, index)"
                        >
                            <div
                                [class]="cx('thumbnail')"
                                [attr.tabindex]="activeIndex === index ? 0 : -1"
                                [attr.aria-current]="activeIndex === index ? 'page' : undefined"
                                [attr.aria-label]="ariaPageLabel(index + 1)"
                                (click)="onItemClick(index)"
                                (touchend)="onItemClick(index)"
                                (keydown.enter)="onItemClick(index)"
                            >
                                <p-galleriaItemSlot type="thumbnail" [item]="item" [templates]="templates"></p-galleriaItemSlot>
                            </div>
                        </div>
                    </div>
                </div>
                <button *ngIf="showThumbnailNavigators" type="button" [class]="cx('thumbnailNextButton')" (click)="navForward($event)" pRipple [attr.aria-label]="ariaNextButtonLabel()">
                    <ng-container *ngIf="!galleria.nextThumbnailIconTemplate && !galleria._nextThumbnailIconTemplate">
                        <svg data-p-icon="chevron-right" *ngIf="!isVertical" [class]="cx('thumbnailNextIcon')" />
                        <svg data-p-icon="chevron-down" *ngIf="isVertical" [class]="cx('thumbnailNextIcon')" />
                    </ng-container>
                    <ng-template *ngTemplateOutlet="galleria.nextThumbnailIconTemplate || galleria._nextThumbnailIconTemplate"></ng-template>
                </button>
            </div>
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [GalleriaStyle]
})
export class GalleriaThumbnails extends BaseComponent implements OnInit, AfterContentChecked, AfterViewInit, OnDestroy {
    @Input() containerId: string | undefined;

    @Input() value: any[] | undefined;

    @Input({ transform: booleanAttribute }) isVertical: boolean = false;

    @Input({ transform: booleanAttribute }) slideShowActive: boolean = false;

    @Input({ transform: booleanAttribute }) circular: boolean = false;

    @Input() responsiveOptions: GalleriaResponsiveOptions[] | undefined;

    @Input() contentHeight: string = '300px';

    @Input() showThumbnailNavigators = true;

    @Input() templates: QueryList<PrimeTemplate> | undefined;

    @Output() onActiveIndexChange: EventEmitter<number> = new EventEmitter();

    @Output() stopSlideShow: EventEmitter<Event> = new EventEmitter();

    @ViewChild('itemsContainer') itemsContainer: ElementRef | undefined;

    @Input() get numVisible(): number {
        return this._numVisible;
    }

    set numVisible(numVisible) {
        this._numVisible = numVisible;
        this._oldNumVisible = this.d_numVisible;
        this.d_numVisible = numVisible;
    }

    @Input() get activeIndex(): number {
        return this._activeIndex;
    }

    set activeIndex(activeIndex) {
        this._oldactiveIndex = this._activeIndex;
        this._activeIndex = activeIndex;
    }

    index: number | undefined;

    startPos: { x: number; y: number } | null = null;

    thumbnailsStyle: HTMLStyleElement | null = null;

    sortedResponsiveOptions: GalleriaResponsiveOptions[] | null = null;

    totalShiftedItems: number = 0;

    page: number = 0;

    documentResizeListener: VoidListener;

    _numVisible: number = 0;

    d_numVisible: number = 0;

    _oldNumVisible: number = 0;

    _activeIndex: number = 0;

    _oldactiveIndex: number = 0;

    _componentStyle = inject(GalleriaStyle);

    constructor(public galleria: Galleria) {
        super();
    }

    ngOnInit() {
        super.ngOnInit();
        if (isPlatformBrowser(this.platformId)) {
            this.createStyle();

            if (this.responsiveOptions) {
                this.bindDocumentListeners();
            }
        }
    }

    ngAfterContentChecked() {
        let totalShiftedItems = this.totalShiftedItems;

        if ((this._oldNumVisible !== this.d_numVisible || this._oldactiveIndex !== this._activeIndex) && this.itemsContainer) {
            if (this._activeIndex <= this.getMedianItemIndex()) {
                totalShiftedItems = 0;
            } else if ((<any[]>this.value).length - this.d_numVisible + this.getMedianItemIndex() < this._activeIndex) {
                totalShiftedItems = this.d_numVisible - (<any[]>this.value).length;
            } else if ((<any[]>this.value).length - this.d_numVisible < this._activeIndex && this.d_numVisible % 2 === 0) {
                totalShiftedItems = this._activeIndex * -1 + this.getMedianItemIndex() + 1;
            } else {
                totalShiftedItems = this._activeIndex * -1 + this.getMedianItemIndex();
            }

            if (totalShiftedItems !== this.totalShiftedItems) {
                this.totalShiftedItems = totalShiftedItems;
            }

            if (this.itemsContainer && this.itemsContainer.nativeElement) {
                this.itemsContainer.nativeElement.style.transform = this.isVertical ? `translate3d(0, ${totalShiftedItems * (100 / this.d_numVisible)}%, 0)` : `translate3d(${totalShiftedItems * (100 / this.d_numVisible)}%, 0, 0)`;
            }

            if (this._oldactiveIndex !== this._activeIndex) {
                removeClass(this.itemsContainer.nativeElement, 'p-items-hidden');
                this.itemsContainer.nativeElement.style.transition = 'transform 500ms ease 0s';
            }

            this._oldactiveIndex = this._activeIndex;
            this._oldNumVisible = this.d_numVisible;
        }
    }

    ngAfterViewInit() {
        super.ngAfterViewInit();
        if (isPlatformBrowser(this.platformId)) {
            this.calculatePosition();
        }
    }

    createStyle() {
        if (!this.thumbnailsStyle) {
            this.thumbnailsStyle = this.document.createElement('style');
            this.document.body.appendChild(this.thumbnailsStyle);
        }

        let innerHTML = `
            #${this.containerId} .p-galleria-thumbnail-item {
                flex: 1 0 ${100 / this.d_numVisible}%
            }
        `;

        if (this.responsiveOptions) {
            this.sortedResponsiveOptions = [...this.responsiveOptions];
            this.sortedResponsiveOptions.sort((data1, data2) => {
                const value1 = data1.breakpoint;
                const value2 = data2.breakpoint;
                let result = null;

                if (value1 == null && value2 != null) result = -1;
                else if (value1 != null && value2 == null) result = 1;
                else if (value1 == null && value2 == null) result = 0;
                else if (typeof value1 === 'string' && typeof value2 === 'string') result = value1.localeCompare(value2, undefined, { numeric: true });
                else result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;

                return -1 * result;
            });

            for (let i = 0; i < this.sortedResponsiveOptions.length; i++) {
                let res = this.sortedResponsiveOptions[i];

                innerHTML += `
                    @media screen and (max-width: ${res.breakpoint}) {
                        #${this.containerId} .p-galleria-thumbnail-item {
                            flex: 1 0 ${100 / res.numVisible}%
                        }
                    }
                `;
            }
        }

        this.thumbnailsStyle.innerHTML = innerHTML;
        setAttribute(this.thumbnailsStyle, 'nonce', this.galleria.config?.csp()?.nonce);
    }

    calculatePosition() {
        if (isPlatformBrowser(this.platformId)) {
            if (this.itemsContainer && this.sortedResponsiveOptions) {
                let windowWidth = window.innerWidth;
                let matchedResponsiveData = {
                    numVisible: this._numVisible
                };

                for (let i = 0; i < this.sortedResponsiveOptions.length; i++) {
                    let res = this.sortedResponsiveOptions[i];

                    if (parseInt(res.breakpoint, 10) >= windowWidth) {
                        matchedResponsiveData = res;
                    }
                }

                if (this.d_numVisible !== matchedResponsiveData.numVisible) {
                    this.d_numVisible = matchedResponsiveData.numVisible;
                    this.cd.markForCheck();
                }
            }
        }
    }

    getTabIndex(index: number) {
        return this.isItemActive(index) ? 0 : null;
    }

    navForward(e: TouchEvent | MouseEvent) {
        this.stopTheSlideShow();

        let nextItemIndex = this._activeIndex + 1;
        if (nextItemIndex + this.totalShiftedItems > this.getMedianItemIndex() && (-1 * this.totalShiftedItems < this.getTotalPageNumber() - 1 || this.circular)) {
            this.step(-1);
        }

        let activeIndex = this.circular && (<any[]>this.value).length - 1 === this._activeIndex ? 0 : nextItemIndex;
        this.onActiveIndexChange.emit(activeIndex);

        if (e.cancelable) {
            e.preventDefault();
        }
    }

    navBackward(e: TouchEvent | MouseEvent) {
        this.stopTheSlideShow();

        let prevItemIndex = this._activeIndex !== 0 ? this._activeIndex - 1 : 0;
        let diff = prevItemIndex + this.totalShiftedItems;
        if (this.d_numVisible - diff - 1 > this.getMedianItemIndex() && (-1 * this.totalShiftedItems !== 0 || this.circular)) {
            this.step(1);
        }

        let activeIndex = this.circular && this._activeIndex === 0 ? (<any[]>this.value).length - 1 : prevItemIndex;
        this.onActiveIndexChange.emit(activeIndex);

        if (e.cancelable) {
            e.preventDefault();
        }
    }

    onItemClick(index: number) {
        this.stopTheSlideShow();

        let selectedItemIndex = index;
        if (selectedItemIndex !== this._activeIndex) {
            const diff = selectedItemIndex + this.totalShiftedItems;
            let dir = 0;
            if (selectedItemIndex < this._activeIndex) {
                dir = this.d_numVisible - diff - 1 - this.getMedianItemIndex();
                if (dir > 0 && -1 * this.totalShiftedItems !== 0) {
                    this.step(dir);
                }
            } else {
                dir = this.getMedianItemIndex() - diff;
                if (dir < 0 && -1 * this.totalShiftedItems < this.getTotalPageNumber() - 1) {
                    this.step(dir);
                }
            }

            this.activeIndex = selectedItemIndex;
            this.onActiveIndexChange.emit(this.activeIndex);
        }
    }

    onThumbnailKeydown(event: KeyboardEvent, index: number) {
        if (event.code === 'Enter' || event.code === 'Space') {
            this.onItemClick(index);
            event.preventDefault();
        }

        switch (event.code) {
            case 'ArrowRight':
                this.onRightKey();
                break;

            case 'ArrowLeft':
                this.onLeftKey();
                break;

            case 'Home':
                this.onHomeKey();
                event.preventDefault();
                break;

            case 'End':
                this.onEndKey();
                event.preventDefault();
                break;

            case 'ArrowUp':
            case 'ArrowDown':
                event.preventDefault();
                break;

            case 'Tab':
                this.onTabKey();
                break;

            default:
                break;
        }
    }

    onRightKey() {
        const indicators = find(this.itemsContainer.nativeElement, '[data-pc-section="thumbnailitem"]');
        const activeIndex = this.findFocusedIndicatorIndex();

        this.changedFocusedIndicator(activeIndex, activeIndex + 1 === indicators.length ? indicators.length - 1 : activeIndex + 1);
    }

    onLeftKey() {
        const activeIndex = this.findFocusedIndicatorIndex();

        this.changedFocusedIndicator(activeIndex, activeIndex - 1 <= 0 ? 0 : activeIndex - 1);
    }

    onHomeKey() {
        const activeIndex = this.findFocusedIndicatorIndex();

        this.changedFocusedIndicator(activeIndex, 0);
    }

    onEndKey() {
        const indicators = find(this.itemsContainer.nativeElement, '[data-pc-section="thumbnailitem"]');
        const activeIndex = this.findFocusedIndicatorIndex();

        this.changedFocusedIndicator(activeIndex, indicators.length - 1);
    }

    onTabKey() {
        const indicators = <any>[...find(this.itemsContainer.nativeElement, '[data-pc-section="thumbnailitem"]')];
        const highlightedIndex = indicators.findIndex((ind) => getAttribute(ind, 'data-p-active') === true);

        const activeIndicator = <any>findSingle(this.itemsContainer.nativeElement, '[tabindex="0"]');

        const activeIndex = indicators.findIndex((ind) => ind === activeIndicator.parentElement);

        indicators[activeIndex].children[0].tabIndex = '-1';
        indicators[highlightedIndex].children[0].tabIndex = '0';
    }

    findFocusedIndicatorIndex() {
        const indicators = [...find(this.itemsContainer.nativeElement, '[data-pc-section="thumbnailitem"]')];
        const activeIndicator = findSingle(this.itemsContainer.nativeElement, '[data-pc-section="thumbnailitem"] > [tabindex="0"]');

        return indicators.findIndex((ind) => ind === activeIndicator.parentElement);
    }

    changedFocusedIndicator(prevInd, nextInd) {
        const indicators = <any>find(this.itemsContainer.nativeElement, '[data-pc-section="thumbnailitem"]');

        indicators[prevInd].children[0].tabIndex = '-1';
        indicators[nextInd].children[0].tabIndex = '0';
        indicators[nextInd].children[0].focus();
    }

    step(dir: number) {
        let totalShiftedItems = this.totalShiftedItems + dir;

        if (dir < 0 && -1 * totalShiftedItems + this.d_numVisible > (<any[]>this.value).length - 1) {
            totalShiftedItems = this.d_numVisible - (<any[]>this.value).length;
        } else if (dir > 0 && totalShiftedItems > 0) {
            totalShiftedItems = 0;
        }

        if (this.circular) {
            if (dir < 0 && (<any[]>this.value).length - 1 === this._activeIndex) {
                totalShiftedItems = 0;
            } else if (dir > 0 && this._activeIndex === 0) {
                totalShiftedItems = this.d_numVisible - (<any[]>this.value).length;
            }
        }

        if (this.itemsContainer) {
            removeClass(this.itemsContainer.nativeElement, 'p-items-hidden');
            this.itemsContainer.nativeElement.style.transform = this.isVertical ? `translate3d(0, ${totalShiftedItems * (100 / this.d_numVisible)}%, 0)` : `translate3d(${totalShiftedItems * (100 / this.d_numVisible)}%, 0, 0)`;
            this.itemsContainer.nativeElement.style.transition = 'transform 500ms ease 0s';
        }

        this.totalShiftedItems = totalShiftedItems;
    }

    stopTheSlideShow() {
        if (this.slideShowActive && this.stopSlideShow) {
            this.stopSlideShow.emit();
        }
    }

    changePageOnTouch(e: TouchEvent, diff: number) {
        if (diff < 0) {
            // left
            this.navForward(e);
        } else {
            // right
            this.navBackward(e);
        }
    }

    getTotalPageNumber() {
        return (<any[]>this.value).length > this.d_numVisible ? (<any[]>this.value).length - this.d_numVisible + 1 : 0;
    }

    getMedianItemIndex() {
        let index = Math.floor(this.d_numVisible / 2);

        return this.d_numVisible % 2 ? index : index - 1;
    }

    onTransitionEnd() {
        if (this.itemsContainer && this.itemsContainer.nativeElement) {
            addClass(this.itemsContainer.nativeElement, 'p-items-hidden');
            this.itemsContainer.nativeElement.style.transition = '';
        }
    }

    onTouchEnd(e: TouchEvent) {
        let touchobj = e.changedTouches[0];

        if (this.isVertical) {
            this.changePageOnTouch(e, touchobj.pageY - (<{ x: number; y: number }>this.startPos).y);
        } else {
            this.changePageOnTouch(e, touchobj.pageX - (<{ x: number; y: number }>this.startPos).x);
        }
    }

    onTouchMove(e: TouchEvent) {
        if (e.cancelable) {
            e.preventDefault();
        }
    }

    onTouchStart(e: TouchEvent) {
        let touchobj = e.changedTouches[0];

        this.startPos = {
            x: touchobj.pageX,
            y: touchobj.pageY
        };
    }

    isNavBackwardDisabled() {
        return (!this.circular && this._activeIndex === 0) || (<any[]>this.value).length <= this.d_numVisible;
    }

    isNavForwardDisabled() {
        return (!this.circular && this._activeIndex === (<any[]>this.value).length - 1) || (<any[]>this.value).length <= this.d_numVisible;
    }

    firstItemAciveIndex() {
        return this.totalShiftedItems * -1;
    }

    lastItemActiveIndex() {
        return this.firstItemAciveIndex() + this.d_numVisible - 1;
    }

    isItemActive(index: number) {
        return this.firstItemAciveIndex() <= index && this.lastItemActiveIndex() >= index;
    }

    bindDocumentListeners() {
        if (isPlatformBrowser(this.platformId)) {
            const window = this.document.defaultView || 'window';
            this.documentResizeListener = this.renderer.listen(window, 'resize', () => {
                this.calculatePosition();
            });
        }
    }

    unbindDocumentListeners() {
        if (this.documentResizeListener) {
            this.documentResizeListener();
            this.documentResizeListener = null;
        }
    }

    ngOnDestroy() {
        super.ngOnDestroy();
        if (this.responsiveOptions) {
            this.unbindDocumentListeners();
        }

        if (this.thumbnailsStyle) {
            this.thumbnailsStyle.parentNode?.removeChild(this.thumbnailsStyle);
        }
    }

    ariaPrevButtonLabel() {
        return this.galleria.config.translation.aria ? this.galleria.config.translation.aria.prevPageLabel : undefined;
    }

    ariaNextButtonLabel() {
        return this.galleria.config.translation.aria ? this.galleria.config.translation.aria.nextPageLabel : undefined;
    }

    ariaPageLabel(value) {
        return this.galleria.config.translation.aria ? this.galleria.config.translation.aria.pageLabel.replace(/{page}/g, value) : undefined;
    }
}

@NgModule({
    imports: [CommonModule, SharedModule, Ripple, TimesIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, FocusTrap],
    exports: [CommonModule, Galleria, GalleriaContent, GalleriaItemSlot, GalleriaItem, GalleriaThumbnails, SharedModule],
    declarations: [Galleria, GalleriaContent, GalleriaItemSlot, GalleriaItem, GalleriaThumbnails]
})
export class GalleriaModule {}
