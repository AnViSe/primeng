import { animate, animateChild, AnimationEvent, query, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    ContentChild,
    ContentChildren,
    EventEmitter,
    inject,
    Input,
    NgModule,
    NgZone,
    numberAttribute,
    OnDestroy,
    OnInit,
    Output,
    QueryList,
    TemplateRef,
    ViewEncapsulation
} from '@angular/core';
import { isEmpty, setAttribute, uuid } from '@primeuix/utils';
import { MessageService, PrimeTemplate, SharedModule, ToastMessageOptions } from 'primeng/api';
import { BaseComponent } from 'primeng/basecomponent';
import { CheckIcon, ExclamationTriangleIcon, InfoCircleIcon, TimesCircleIcon, TimesIcon } from 'primeng/icons';
import { ZIndexUtils } from 'primeng/utils';
import { Subscription } from 'rxjs';
import { ToastStyle } from './style/toaststyle';
import { ToastCloseEvent, ToastItemCloseEvent, ToastPositionType } from './toast.interface';

@Component({
    selector: 'p-toastItem',
    standalone: true,
    imports: [CommonModule, CheckIcon, ExclamationTriangleIcon, InfoCircleIcon, TimesIcon, TimesCircleIcon, SharedModule],
    template: `
        <div
            #container
            [attr.id]="message?.id"
            [class]="cn(cx('message'), message?.styleClass)"
            [@messageState]="{
                value: 'visible',
                params: {
                    showTransformParams: showTransformOptions,
                    hideTransformParams: hideTransformOptions,
                    showTransitionParams: showTransitionOptions,
                    hideTransitionParams: hideTransitionOptions
                }
            }"
            (mouseenter)="onMouseEnter()"
            (mouseleave)="onMouseLeave()"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            [attr.data-pc-name]="'toast'"
            [attr.data-pc-section]="'root'"
        >
            @if (headlessTemplate) {
                <ng-container *ngTemplateOutlet="headlessTemplate; context: { $implicit: message, closeFn: onCloseIconClick }"></ng-container>
            } @else {
                <div [class]="cn(cx('messageContent'), message?.contentStyleClass)" [attr.data-pc-section]="'content'">
                    <ng-container *ngIf="!template">
                        @if (message.icon) {
                            <span [class]="cn(cx('messageIcon'), message?.icon)"></span>
                        } @else {
                            @switch (message.severity) {
                                @case ('success') {
                                    <svg data-p-icon="check" [class]="cx('messageIcon')" [attr.aria-hidden]="true" [attr.data-pc-section]="'icon'" />
                                }
                                @case ('info') {
                                    <svg data-p-icon="info-circle" [class]="cx('messageIcon')" [attr.aria-hidden]="true" [attr.data-pc-section]="'icon'" />
                                }
                                @case ('error') {
                                    <svg data-p-icon="times-circle" [class]="cx('messageIcon')" [attr.aria-hidden]="true" [attr.data-pc-section]="'icon'" />
                                }
                                @case ('warn') {
                                    <svg data-p-icon="exclamation-triangle" [class]="cx('messageIcon')" [attr.aria-hidden]="true" [attr.data-pc-section]="'icon'" />
                                }
                                @default {
                                    <svg data-p-icon="info-circle" [class]="cx('messageIcon')" [attr.aria-hidden]="true" [attr.data-pc-section]="'icon'" />
                                }
                            }
                        }
                        <div [ngClass]="cx('messageText')" [attr.data-pc-section]="'text'">
                            <div [ngClass]="cx('summary')" [attr.data-pc-section]="'summary'">
                                {{ message.summary }}
                            </div>
                            <div [ngClass]="cx('detail')" [attr.data-pc-section]="'detail'">{{ message.detail }}</div>
                        </div>
                    </ng-container>
                    <ng-container *ngTemplateOutlet="template; context: { $implicit: message }"></ng-container>
                    @if (message?.closable !== false) {
                        <div>
                            <button type="button" [attr.class]="cx('closeButton')" (click)="onCloseIconClick($event)" (keydown.enter)="onCloseIconClick($event)" [attr.aria-label]="closeAriaLabel" [attr.data-pc-section]="'closebutton'" autofocus>
                                @if (message.closeIcon) {
                                    <span *ngIf="message.closeIcon" [class]="cn(cx('closeIcon'), message?.closeIcon)"></span>
                                } @else {
                                    <svg data-p-icon="times" [class]="cx('closeIcon')" [attr.aria-hidden]="true" [attr.data-pc-section]="'closeicon'" />
                                }
                            </button>
                        </div>
                    }
                </div>
            }
        </div>
    `,
    animations: [
        trigger('messageState', [
            state(
                'visible',
                style({
                    transform: 'translateY(0)',
                    opacity: 1
                })
            ),
            transition('void => *', [
                style({
                    transform: '{{showTransformParams}}',
                    opacity: 0
                }),
                animate('{{showTransitionParams}}')
            ]),
            transition('* => void', [
                animate(
                    '{{hideTransitionParams}}',
                    style({
                        height: 0,
                        opacity: 0,
                        transform: '{{hideTransformParams}}'
                    })
                )
            ])
        ])
    ],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ToastStyle]
})
export class ToastItem extends BaseComponent implements AfterViewInit, OnDestroy {
    @Input() message: ToastMessageOptions | null | undefined;

    @Input({ transform: numberAttribute }) index: number | null | undefined;

    @Input({ transform: numberAttribute }) life: number;

    @Input() template: TemplateRef<any> | undefined;

    @Input() headlessTemplate: TemplateRef<any> | undefined;

    @Input() showTransformOptions: string | undefined;

    @Input() hideTransformOptions: string | undefined;

    @Input() showTransitionOptions: string | undefined;

    @Input() hideTransitionOptions: string | undefined;

    @Output() onClose: EventEmitter<ToastItemCloseEvent> = new EventEmitter();

    _componentStyle = inject(ToastStyle);

    timeout: any;

    constructor(private zone: NgZone) {
        super();
    }

    ngAfterViewInit() {
        super.ngAfterViewInit();
        this.initTimeout();
    }

    initTimeout() {
        if (!this.message?.sticky) {
            this.zone.runOutsideAngular(() => {
                this.timeout = setTimeout(
                    () => {
                        this.onClose.emit({
                            index: <number>this.index,
                            message: <ToastMessageOptions>this.message
                        });
                    },
                    this.message?.life || this.life || 3000
                );
            });
        }
    }

    clearTimeout() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }

    onMouseEnter() {
        this.clearTimeout();
    }

    onMouseLeave() {
        this.initTimeout();
    }

    onCloseIconClick = (event: Event) => {
        this.clearTimeout();

        this.onClose.emit({
            index: <number>this.index,
            message: <ToastMessageOptions>this.message
        });

        event.preventDefault();
    };

    get closeAriaLabel() {
        return this.config.translation.aria ? this.config.translation.aria.close : undefined;
    }

    ngOnDestroy() {
        this.clearTimeout();
        super.ngOnDestroy();
    }
}

/**
 * Toast is used to display messages in an overlay.
 * @group Components
 */
@Component({
    selector: 'p-toast',
    standalone: true,
    imports: [CommonModule, ToastItem, SharedModule],
    template: `
        <p-toastItem
            *ngFor="let msg of messages; let i = index"
            [message]="msg"
            [index]="i"
            [life]="life"
            (onClose)="onMessageClose($event)"
            [template]="template || _template"
            [headlessTemplate]="headlessTemplate || _headlessTemplate"
            @toastAnimation
            (@toastAnimation.start)="onAnimationStart($event)"
            (@toastAnimation.done)="onAnimationEnd($event)"
            [showTransformOptions]="showTransformOptions"
            [hideTransformOptions]="hideTransformOptions"
            [showTransitionOptions]="showTransitionOptions"
            [hideTransitionOptions]="hideTransitionOptions"
        ></p-toastItem>
    `,
    animations: [trigger('toastAnimation', [transition(':enter, :leave', [query('@*', animateChild())])])],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [ToastStyle],
    host: {
        '[class]': "cn(cx('root'), styleClass)",
        '[style]': "sx('root')"
    }
})
export class Toast extends BaseComponent implements OnInit, OnDestroy {
    /**
     * Key of the message in case message is targeted to a specific toast component.
     * @group Props
     */
    @Input() key: string | undefined;
    /**
     * Whether to automatically manage layering.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) autoZIndex: boolean = true;
    /**
     * Base zIndex value to use in layering.
     * @group Props
     */
    @Input({ transform: numberAttribute }) baseZIndex: number = 0;
    /**
     * The default time to display messages for in milliseconds.
     * @group Props
     */
    @Input({ transform: numberAttribute }) life: number = 3000;
    /**
     * Inline class of the component.
     * @deprecated since v20.0.0, use `class` instead.
     * @group Props
     */
    @Input() styleClass: string | undefined;
    /**
     * Position of the toast in viewport.
     * @group Props
     */
    @Input() get position(): ToastPositionType {
        return this._position;
    }

    set position(value: ToastPositionType) {
        this._position = value;
        this.cd.markForCheck();
    }

    /**
     * It does not add the new message if there is already a toast displayed with the same content
     * @group Props
     */
    @Input({ transform: booleanAttribute }) preventOpenDuplicates: boolean = false;
    /**
     * Displays only once a message with the same content.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) preventDuplicates: boolean = false;
    /**
     * Transform options of the show animation.
     * @group Props
     */
    @Input() showTransformOptions: string = 'translateY(100%)';
    /**
     * Transform options of the hide animation.
     * @group Props
     */
    @Input() hideTransformOptions: string = 'translateY(-100%)';
    /**
     * Transition options of the show animation.
     * @group Props
     */
    @Input() showTransitionOptions: string = '300ms ease-out';
    /**
     * Transition options of the hide animation.
     * @group Props
     */
    @Input() hideTransitionOptions: string = '250ms ease-in';
    /**
     * Object literal to define styles per screen size.
     * @group Props
     */
    @Input() breakpoints: { [key: string]: any } | undefined;
    /**
     * Callback to invoke when a message is closed.
     * @param {ToastCloseEvent} event - custom close event.
     * @group Emits
     */
    @Output() onClose: EventEmitter<ToastCloseEvent> = new EventEmitter<ToastCloseEvent>();
    /**
     * Custom template of message.
     * @group Templates
     */
    @ContentChild('message') template: TemplateRef<any> | undefined;
    /**
     * Custom headless template.
     * @group Templates
     */
    @ContentChild('headless') headlessTemplate: TemplateRef<any> | undefined;

    messageSubscription: Subscription | undefined;

    clearSubscription: Subscription | undefined;

    messages: ToastMessageOptions[] | null | undefined;

    messagesArchieve: ToastMessageOptions[] | undefined;

    _position: ToastPositionType = 'top-right';

    messageService: MessageService = inject(MessageService);

    _componentStyle = inject(ToastStyle);

    styleElement: any;

    id: string = uuid('pn_id_');

    @ContentChildren(PrimeTemplate) templates: QueryList<PrimeTemplate> | undefined;

    constructor() {
        super();
    }

    ngOnInit() {
        super.ngOnInit();

        this.messageSubscription = this.messageService.messageObserver.subscribe((messages) => {
            if (messages) {
                if (Array.isArray(messages)) {
                    const filteredMessages = messages.filter((m) => this.canAdd(m));
                    this.add(filteredMessages);
                } else if (this.canAdd(messages)) {
                    this.add([messages]);
                }
            }
        });

        this.clearSubscription = this.messageService.clearObserver.subscribe((key) => {
            if (key) {
                if (this.key === key) {
                    this.messages = null;
                }
            } else {
                this.messages = null;
            }

            this.cd.markForCheck();
        });
    }

    _template: TemplateRef<any> | undefined;

    _headlessTemplate: TemplateRef<any> | undefined;

    ngAfterContentInit() {
        this.templates?.forEach((item) => {
            switch (item.getType()) {
                case 'message':
                    this._template = item.template;
                    break;
                case 'headless':
                    this._headlessTemplate = item.template;
                    break;

                default:
                    this._template = item.template;
                    break;
            }
        });
    }

    ngAfterViewInit() {
        super.ngAfterViewInit();
        if (this.breakpoints) {
            this.createStyle();
        }
    }

    add(messages: ToastMessageOptions[]): void {
        this.messages = this.messages ? [...this.messages, ...messages] : [...messages];

        if (this.preventDuplicates) {
            this.messagesArchieve = this.messagesArchieve ? [...this.messagesArchieve, ...messages] : [...messages];
        }

        this.cd.markForCheck();
    }

    canAdd(message: ToastMessageOptions): boolean {
        let allow = this.key === message.key;

        if (allow && this.preventOpenDuplicates) {
            allow = !this.containsMessage(this.messages!, message);
        }

        if (allow && this.preventDuplicates) {
            allow = !this.containsMessage(this.messagesArchieve!, message);
        }

        return allow;
    }

    containsMessage(collection: ToastMessageOptions[], message: ToastMessageOptions): boolean {
        if (!collection) {
            return false;
        }

        return (
            collection.find((m) => {
                return m.summary === message.summary && m.detail == message.detail && m.severity === message.severity;
            }) != null
        );
    }

    onMessageClose(event: ToastItemCloseEvent) {
        this.messages?.splice(event.index, 1);

        this.onClose.emit({
            message: event.message
        });

        this.cd.detectChanges();
    }

    onAnimationStart(event: AnimationEvent) {
        if (event.fromState === 'void') {
            this.renderer.setAttribute(this.el?.nativeElement, this.id, '');
            if (this.autoZIndex && this.el?.nativeElement.style.zIndex === '') {
                ZIndexUtils.set('modal', this.el?.nativeElement, this.baseZIndex || this.config.zIndex.modal);
            }
        }
    }

    onAnimationEnd(event: AnimationEvent) {
        if (event.toState === 'void') {
            if (this.autoZIndex && isEmpty(this.messages)) {
                ZIndexUtils.clear(this.el?.nativeElement);
            }
        }
    }

    createStyle() {
        if (!this.styleElement) {
            this.styleElement = this.renderer.createElement('style');
            this.styleElement.type = 'text/css';
            this.renderer.appendChild(this.document.head, this.styleElement);
            let innerHTML = '';
            for (let breakpoint in this.breakpoints) {
                let breakpointStyle = '';
                for (let styleProp in this.breakpoints[breakpoint]) {
                    breakpointStyle += styleProp + ':' + this.breakpoints[breakpoint][styleProp] + ' !important;';
                }
                innerHTML += `
                    @media screen and (max-width: ${breakpoint}) {
                        .p-toast[${this.id}] {
                           ${breakpointStyle}
                        }
                    }
                `;
            }

            this.renderer.setProperty(this.styleElement, 'innerHTML', innerHTML);
            setAttribute(this.styleElement, 'nonce', this.config?.csp()?.nonce);
        }
    }

    destroyStyle() {
        if (this.styleElement) {
            this.renderer.removeChild(this.document.head, this.styleElement);
            this.styleElement = null;
        }
    }

    ngOnDestroy() {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
        }

        if (this.el && this.autoZIndex) {
            ZIndexUtils.clear(this.el.nativeElement);
        }

        if (this.clearSubscription) {
            this.clearSubscription.unsubscribe();
        }

        this.destroyStyle();
        super.ngOnDestroy();
    }
}

@NgModule({
    imports: [Toast, SharedModule],
    exports: [Toast, SharedModule]
})
export class ToastModule {}
