import { animate, animation, style, transition, trigger, useAnimation } from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    ContentChild,
    ContentChildren,
    ElementRef,
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
import { findSingle, setAttribute, uuid } from '@primeuix/utils';
import { Confirmation, ConfirmationService, ConfirmEventType, Footer, PrimeTemplate, SharedModule, TranslationKeys } from 'primeng/api';
import { BaseComponent } from 'primeng/basecomponent';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Nullable } from 'primeng/ts-helpers';
import { Subscription } from 'rxjs';
import { ConfirmDialogStyle } from './style/confirmdialogstyle';

const showAnimation = animation([style({ transform: '{{transform}}', opacity: 0 }), animate('{{transition}}', style({ transform: 'none', opacity: 1 }))]);

const hideAnimation = animation([animate('{{transition}}', style({ transform: '{{transform}}', opacity: 0 }))]);
/**
 * ConfirmDialog uses a Dialog UI that is integrated with the Confirmation API.
 * @group Components
 */
@Component({
    selector: 'p-confirmDialog, p-confirmdialog, p-confirm-dialog',
    standalone: true,
    imports: [CommonModule, Button, Dialog, SharedModule],
    template: `
        <p-dialog
            #dialog
            [visible]="visible"
            (visibleChange)="onVisibleChange($event)"
            role="alertdialog"
            [closable]="option('closable')"
            [styleClass]="cn(cx('root'), styleClass)"
            [modal]="true"
            [header]="option('header')"
            [closeOnEscape]="option('closeOnEscape')"
            [blockScroll]="option('blockScroll')"
            [appendTo]="option('appendTo')"
            [position]="position"
            [style]="style"
            [dismissableMask]="dismissableMask"
            [draggable]="draggable"
        >
            @if (headlessTemplate || _headlessTemplate) {
                <ng-template #headless>
                    <ng-container
                        *ngTemplateOutlet="
                            headlessTemplate || _headlessTemplate;
                            context: {
                                $implicit: confirmation,
                                onAccept: onAccept.bind(this),
                                onReject: onReject.bind(this)
                            }
                        "
                    ></ng-container>
                </ng-template>
            } @else {
                @if (headerTemplate || _headerTemplate) {
                    <ng-template #header>
                        <ng-container *ngTemplateOutlet="headerTemplate || _headerTemplate"></ng-container>
                    </ng-template>
                }

                <ng-template #content>
                    @if (iconTemplate || _iconTemplate) {
                        <ng-template *ngTemplateOutlet="iconTemplate || _iconTemplate"></ng-template>
                    } @else if (!iconTemplate && !_iconTemplate && !_messageTemplate && !messageTemplate) {
                        <i [ngClass]="cx('icon')" [class]="option('icon')" *ngIf="option('icon')"></i>
                    }
                    @if (messageTemplate || _messageTemplate) {
                        <ng-template *ngTemplateOutlet="messageTemplate || _messageTemplate; context: { $implicit: confirmation }"></ng-template>
                    } @else {
                        <span [class]="cx('message')" [innerHTML]="option('message')"> </span>
                    }
                </ng-template>
            }
            <ng-template #footer>
                @if (footerTemplate || _footerTemplate) {
                    <ng-content select="p-footer"></ng-content>
                    <ng-container *ngTemplateOutlet="footerTemplate || _footerTemplate"></ng-container>
                }
                @if (!footerTemplate && !_footerTemplate) {
                    <p-button
                        *ngIf="option('rejectVisible')"
                        [label]="rejectButtonLabel"
                        (onClick)="onReject()"
                        [styleClass]="getButtonStyleClass('pcRejectButton', 'rejectButtonStyleClass')"
                        [ariaLabel]="option('rejectButtonProps', 'ariaLabel')"
                        [buttonProps]="getRejectButtonProps()"
                    >
                        <ng-template #icon>
                            @if (rejectIcon && !rejectIconTemplate && !_rejectIconTemplate) {
                                <i *ngIf="option('rejectIcon')" [class]="option('rejectIcon')"></i>
                            }
                            <ng-template *ngTemplateOutlet="rejectIconTemplate || _rejectIconTemplate"></ng-template>
                        </ng-template>
                    </p-button>
                    <p-button
                        [label]="acceptButtonLabel"
                        (onClick)="onAccept()"
                        [styleClass]="getButtonStyleClass('pcAcceptButton', 'acceptButtonStyleClass')"
                        *ngIf="option('acceptVisible')"
                        [ariaLabel]="option('acceptButtonProps', 'ariaLabel')"
                        [buttonProps]="getAcceptButtonProps()"
                    >
                        <ng-template #icon>
                            @if (acceptIcon && !_acceptIconTemplate && !acceptIconTemplate) {
                                <i *ngIf="option('acceptIcon')" [class]="option('acceptIcon')"></i>
                            }
                            <ng-template *ngTemplateOutlet="acceptIconTemplate || _acceptIconTemplate"></ng-template>
                        </ng-template>
                    </p-button>
                }
            </ng-template>
        </p-dialog>
    `,
    animations: [trigger('animation', [transition('void => visible', [useAnimation(showAnimation)]), transition('visible => void', [useAnimation(hideAnimation)])])],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [ConfirmDialogStyle]
})
export class ConfirmDialog extends BaseComponent implements OnInit, OnDestroy {
    /**
     * Title text of the dialog.
     * @group Props
     */
    @Input() header: string | undefined;
    /**
     * Icon to display next to message.
     * @group Props
     */
    @Input() icon: string | undefined;
    /**
     * Message of the confirmation.
     * @group Props
     */
    @Input() message: string | undefined;
    /**
     * Inline style of the element.
     * @group Props
     */
    @Input() get style(): { [klass: string]: any } | null | undefined {
        return this._style;
    }
    set style(value: { [klass: string]: any } | null | undefined) {
        this._style = value;
        this.cd.markForCheck();
    }
    /**
     * Class of the element.
     * @group Props
     */
    @Input() styleClass: string | undefined;
    /**
     * Specify the CSS class(es) for styling the mask element
     * @group Props
     */
    @Input() maskStyleClass: string | undefined;
    /**
     * Icon of the accept button.
     * @group Props
     */
    @Input() acceptIcon: string | undefined;
    /**
     * Label of the accept button.
     * @group Props
     */
    @Input() acceptLabel: string | undefined;
    /**
     * Defines a string that labels the close button for accessibility.
     * @group Props
     */
    @Input() closeAriaLabel: string | undefined;
    /**
     * Defines a string that labels the accept button for accessibility.
     * @group Props
     */
    @Input() acceptAriaLabel: string | undefined;
    /**
     * Visibility of the accept button.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) acceptVisible: boolean = true;
    /**
     * Icon of the reject button.
     * @group Props
     */
    @Input() rejectIcon: string | undefined;
    /**
     * Label of the reject button.
     * @group Props
     */
    @Input() rejectLabel: string | undefined;
    /**
     * Defines a string that labels the reject button for accessibility.
     * @group Props
     */
    @Input() rejectAriaLabel: string | undefined;
    /**
     * Visibility of the reject button.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) rejectVisible: boolean = true;
    /**
     * Style class of the accept button.
     * @group Props
     */
    @Input() acceptButtonStyleClass: string | undefined;
    /**
     * Style class of the reject button.
     * @group Props
     */
    @Input() rejectButtonStyleClass: string | undefined;
    /**
     * Specifies if pressing escape key should hide the dialog.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) closeOnEscape: boolean = true;
    /**
     * Specifies if clicking the modal background should hide the dialog.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) dismissableMask: boolean | undefined;
    /**
     * Determines whether scrolling behavior should be blocked within the component.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) blockScroll: boolean = true;
    /**
     * When enabled dialog is displayed in RTL direction.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) rtl: boolean = false;
    /**
     * Adds a close icon to the header to hide the dialog.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) closable: boolean = true;
    /**
     *  Target element to attach the dialog, valid values are "body" or a local ng-template variable of another element (note: use binding with brackets for template variables, e.g. [appendTo]="mydiv" for a div element having #mydiv as variable name).
     * @group Props
     */
    @Input() appendTo: HTMLElement | ElementRef | TemplateRef<any> | string | null | undefined | any = 'body';
    /**
     * Optional key to match the key of confirm object, necessary to use when component tree has multiple confirm dialogs.
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
     * Transition options of the animation.
     * @group Props
     */
    @Input() transitionOptions: string = '150ms cubic-bezier(0, 0, 0.2, 1)';
    /**
     * When enabled, can only focus on elements inside the confirm dialog.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) focusTrap: boolean = true;
    /**
     * Element to receive the focus when the dialog gets visible.
     * @group Props
     */
    @Input() defaultFocus: 'accept' | 'reject' | 'close' | 'none' = 'accept';
    /**
     * Object literal to define widths per screen size.
     * @group Props
     */
    @Input() breakpoints: any;
    /**
     * Current visible state as a boolean.
     * @group Props
     */
    @Input() get visible(): any {
        return this._visible;
    }

    set visible(value: any) {
        this._visible = value;

        if (this._visible && !this.maskVisible) {
            this.maskVisible = true;
        }

        this.cd.markForCheck();
    }
    /**
     *  Allows getting the position of the component.
     * @group Props
     */
    @Input() get position() {
        return this._position;
    }
    set position(value: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright') {
        this._position = value;

        switch (value) {
            case 'topleft':
            case 'bottomleft':
            case 'left':
                this.transformOptions = 'translate3d(-100%, 0px, 0px)';
                break;
            case 'topright':
            case 'bottomright':
            case 'right':
                this.transformOptions = 'translate3d(100%, 0px, 0px)';
                break;
            case 'bottom':
                this.transformOptions = 'translate3d(0px, 100%, 0px)';
                break;
            case 'top':
                this.transformOptions = 'translate3d(0px, -100%, 0px)';
                break;
            default:
                this.transformOptions = 'scale(0.7)';
                break;
        }
    }
    /**
     * Enables dragging to change the position using header.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) draggable: boolean = true;
    /**
     * Callback to invoke when dialog is hidden.
     * @param {ConfirmEventType} enum - Custom confirm event.
     * @group Emits
     */
    @Output() onHide: EventEmitter<ConfirmEventType> = new EventEmitter<ConfirmEventType>();

    @ContentChild(Footer) footer: Nullable<TemplateRef<any>>;

    _componentStyle = inject(ConfirmDialogStyle);

    @ContentChild('header', { descendants: false }) headerTemplate: Nullable<TemplateRef<any>>;

    @ContentChild('footer', { descendants: false }) footerTemplate: Nullable<TemplateRef<any>>;

    @ContentChild('rejecticon', { descendants: false }) rejectIconTemplate: Nullable<TemplateRef<any>>;

    @ContentChild('accepticon', { descendants: false }) acceptIconTemplate: Nullable<TemplateRef<any>>;

    @ContentChild('message', { descendants: false }) messageTemplate: Nullable<TemplateRef<any>>;

    @ContentChild('icon', { descendants: false }) iconTemplate: Nullable<TemplateRef<any>>;

    @ContentChild('headless', { descendants: false }) headlessTemplate: Nullable<TemplateRef<any>>;

    @ContentChildren(PrimeTemplate) templates: QueryList<PrimeTemplate> | undefined;

    _headerTemplate: TemplateRef<any> | undefined;

    _footerTemplate: TemplateRef<any> | undefined;

    _rejectIconTemplate: TemplateRef<any> | undefined;

    _acceptIconTemplate: TemplateRef<any> | undefined;

    _messageTemplate: TemplateRef<any> | undefined;

    _iconTemplate: TemplateRef<any> | undefined;

    _headlessTemplate: TemplateRef<any> | undefined;

    confirmation: Nullable<Confirmation>;

    _visible: boolean | undefined;

    _style: { [klass: string]: any } | null | undefined;

    maskVisible: boolean | undefined;

    dialog: Nullable<Dialog>;

    wrapper: Nullable<HTMLElement>;

    contentContainer: Nullable<HTMLDivElement>;

    subscription: Subscription;

    preWidth: number | undefined;

    _position: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright' = 'center';

    transformOptions: any = 'scale(0.7)';

    styleElement: any;

    id = uuid('pn_id_');

    ariaLabelledBy: string = this.getAriaLabelledBy();

    translationSubscription: Subscription | undefined;

    constructor(
        private confirmationService: ConfirmationService,
        public zone: NgZone
    ) {
        super();
        this.subscription = this.confirmationService.requireConfirmation$.subscribe((confirmation) => {
            if (!confirmation) {
                this.hide();
                return;
            }
            if (confirmation.key === this.key) {
                this.confirmation = confirmation;

                const keys = Object.keys(confirmation);

                keys.forEach((key) => {
                    this[key] = confirmation[key];
                });

                if (this.confirmation.accept) {
                    this.confirmation.acceptEvent = new EventEmitter();
                    this.confirmation.acceptEvent.subscribe(this.confirmation.accept);
                }

                if (this.confirmation.reject) {
                    this.confirmation.rejectEvent = new EventEmitter();
                    this.confirmation.rejectEvent.subscribe(this.confirmation.reject);
                }

                this.visible = true;
            }
        });
    }

    ngOnInit() {
        super.ngOnInit();
        if (this.breakpoints) {
            this.createStyle();
        }

        this.translationSubscription = this.config.translationObserver.subscribe(() => {
            if (this.visible) {
                this.cd.markForCheck();
            }
        });
    }

    ngAfterContentInit() {
        this.templates?.forEach((item) => {
            switch (item.getType()) {
                case 'header':
                    this._headerTemplate = item.template;
                    break;

                case 'footer':
                    this._footerTemplate = item.template;
                    break;

                case 'message':
                    this._messageTemplate = item.template;
                    break;

                case 'icon':
                    this._iconTemplate = item.template;
                    break;

                case 'rejecticon':
                    this._rejectIconTemplate = item.template;
                    break;

                case 'accepticon':
                    this._acceptIconTemplate = item.template;
                    break;

                case 'headless':
                    this._headlessTemplate = item.template;
                    break;
            }
        });
    }

    getAriaLabelledBy() {
        return this.header !== null ? uuid('pn_id_') + '_header' : null;
    }

    option(name: string, k?: string) {
        const source: { [key: string]: any } = this;
        if (source.hasOwnProperty(name)) {
            if (k) {
                return source[k];
            }
            return source[name];
        }

        return undefined;
    }

    getButtonStyleClass(cx: string, opt: string): string {
        const cxClass = this.cx(cx);
        const optionClass = this.option(opt);

        return [cxClass, optionClass].filter(Boolean).join(' ');
    }

    getElementToFocus() {
        switch (this.option('defaultFocus')) {
            case 'accept':
                return findSingle(this.dialog.el.nativeElement, '.p-confirm-dialog-accept');

            case 'reject':
                return findSingle(this.dialog.el.nativeElement, '.p-confirm-dialog-reject');

            case 'close':
                return findSingle(this.dialog.el.nativeElement, '.p-dialog-header-close');

            case 'none':
                return null;

            //backward compatibility
            default:
                return findSingle(this.dialog.el.nativeElement, '.p-confirm-dialog-accept');
        }
    }

    createStyle() {
        if (!this.styleElement) {
            this.styleElement = this.document.createElement('style');
            this.styleElement.type = 'text/css';
            this.document.head.appendChild(this.styleElement);
            let innerHTML = '';
            for (let breakpoint in this.breakpoints) {
                innerHTML += `
                    @media screen and (max-width: ${breakpoint}) {
                        .p-dialog[${this.id}] {
                            width: ${this.breakpoints[breakpoint]} !important;
                        }
                    }
                `;
            }

            this.styleElement.innerHTML = innerHTML;
            setAttribute(this.styleElement, 'nonce', this.config?.csp()?.nonce);
        }
    }

    close() {
        if (this.confirmation?.rejectEvent) {
            this.confirmation.rejectEvent.emit(ConfirmEventType.CANCEL);
        }

        this.hide(ConfirmEventType.CANCEL);
    }

    hide(type?: ConfirmEventType) {
        this.onHide.emit(type);
        this.visible = false;
        // Unsubscribe from confirmation events when the dialogue is closed, because events are created when the dialogue is opened.
        this.unsubscribeConfirmationEvents();
        this.confirmation = null;
    }

    destroyStyle() {
        if (this.styleElement) {
            this.document.head.removeChild(this.styleElement);
            this.styleElement = null;
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        // Unsubscribe from confirmation events if the dialogue is opened and this component is somehow destroyed.
        this.unsubscribeConfirmationEvents();

        if (this.translationSubscription) {
            this.translationSubscription.unsubscribe();
        }

        this.destroyStyle();
        super.ngOnDestroy();
    }

    onVisibleChange(value: boolean) {
        if (!value) {
            this.close();
        } else {
            this.visible = value;
        }
    }

    onAccept() {
        if (this.confirmation && this.confirmation.acceptEvent) {
            this.confirmation.acceptEvent.emit();
        }
        this.hide(ConfirmEventType.ACCEPT);
    }

    onReject() {
        if (this.confirmation && this.confirmation.rejectEvent) {
            this.confirmation.rejectEvent.emit(ConfirmEventType.REJECT);
        }

        this.hide(ConfirmEventType.REJECT);
    }

    unsubscribeConfirmationEvents() {
        if (this.confirmation) {
            this.confirmation.acceptEvent?.unsubscribe();
            this.confirmation.rejectEvent?.unsubscribe();
        }
    }

    get acceptButtonLabel(): string {
        return this.option('acceptLabel') || this.getAcceptButtonProps()?.label || this.config.getTranslation(TranslationKeys.ACCEPT);
    }

    get rejectButtonLabel(): string {
        return this.option('rejectLabel') || this.getRejectButtonProps()?.label || this.config.getTranslation(TranslationKeys.REJECT);
    }

    getAcceptButtonProps() {
        return this.option('acceptButtonProps');
    }

    getRejectButtonProps() {
        return this.option('rejectButtonProps');
    }
}

@NgModule({
    imports: [ConfirmDialog, SharedModule],
    exports: [ConfirmDialog, SharedModule]
})
export class ConfirmDialogModule {}
