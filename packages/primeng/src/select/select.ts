import { AnimationEvent } from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
    AfterContentInit,
    AfterViewChecked,
    AfterViewInit,
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    computed,
    ContentChild,
    ContentChildren,
    effect,
    ElementRef,
    EventEmitter,
    forwardRef,
    inject,
    input,
    Input,
    NgModule,
    NgZone,
    numberAttribute,
    OnInit,
    Output,
    QueryList,
    Signal,
    signal,
    TemplateRef,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { deepEquals, equals, findLastIndex, findSingle, focus, getFirstFocusableElement, getFocusableElements, getLastFocusableElement, isEmpty, isNotEmpty, isPrintableCharacter, resolveFieldData, scrollInView, uuid } from '@primeuix/utils';
import { FilterService, OverlayOptions, PrimeTemplate, ScrollerOptions, SharedModule, TranslationKeys } from 'primeng/api';
import { AutoFocus } from 'primeng/autofocus';
import { BaseComponent } from 'primeng/basecomponent';
import { BaseInput } from 'primeng/baseinput';
import { unblockBodyScroll } from 'primeng/dom';
import { IconField } from 'primeng/iconfield';
import { BlankIcon, CheckIcon, ChevronDownIcon, SearchIcon, TimesIcon } from 'primeng/icons';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Overlay } from 'primeng/overlay';
import { Ripple } from 'primeng/ripple';
import { Scroller } from 'primeng/scroller';
import { Tooltip } from 'primeng/tooltip';
import { Nullable } from 'primeng/ts-helpers';
import { SelectChangeEvent, SelectFilterEvent, SelectFilterOptions, SelectLazyLoadEvent } from './select.interface';
import { SelectStyle } from './style/selectstyle';

export const SELECT_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => Select),
    multi: true
};

@Component({
    selector: 'p-selectItem',
    standalone: true,
    imports: [CommonModule, SharedModule, Ripple, CheckIcon, BlankIcon],
    template: `
        <li
            [id]="id"
            (click)="onOptionClick($event)"
            (mouseenter)="onOptionMouseEnter($event)"
            role="option"
            pRipple
            [attr.aria-label]="label"
            [attr.aria-setsize]="ariaSetSize"
            [attr.aria-posinset]="ariaPosInset"
            [attr.aria-selected]="selected"
            [attr.data-p-focused]="focused"
            [attr.data-p-highlight]="selected"
            [attr.data-p-disabled]="disabled"
            [ngStyle]="{ height: itemSize + 'px' }"
            [class]="cx('option')"
        >
            <ng-container *ngIf="checkmark">
                <svg data-p-icon="check" *ngIf="selected" [class]="cx('optionCheckIcon')" />
                <svg data-p-icon="blank" *ngIf="!selected" [class]="cx('optionBlankIcon')" />
            </ng-container>
            <span *ngIf="!template">{{ label ?? 'empty' }}</span>
            <ng-container *ngTemplateOutlet="template; context: { $implicit: option }"></ng-container>
        </li>
    `,
    providers: [SelectStyle]
})
export class SelectItem extends BaseComponent {
    @Input() id: string | undefined;

    @Input() option: any;

    @Input({ transform: booleanAttribute }) selected: boolean | undefined;

    @Input({ transform: booleanAttribute }) focused: boolean | undefined;

    @Input() label: string | undefined;

    @Input({ transform: booleanAttribute }) disabled: boolean | undefined;

    @Input({ transform: booleanAttribute }) visible: boolean | undefined;

    @Input({ transform: numberAttribute }) itemSize: number | undefined;

    @Input() ariaPosInset: string | undefined;

    @Input() ariaSetSize: string | undefined;

    @Input() template: TemplateRef<any> | undefined;

    @Input({ transform: booleanAttribute }) checkmark: boolean;

    @Output() onClick: EventEmitter<any> = new EventEmitter();

    @Output() onMouseEnter: EventEmitter<any> = new EventEmitter();

    _componentStyle = inject(SelectStyle);

    onOptionClick(event: Event) {
        this.onClick.emit(event);
    }

    onOptionMouseEnter(event: Event) {
        this.onMouseEnter.emit(event);
    }
}

/**
 * Select is used to choose an item from a collection of options.
 * @group Components
 */

@Component({
    selector: 'p-select',
    standalone: true,
    imports: [CommonModule, SelectItem, Overlay, Tooltip, AutoFocus, TimesIcon, ChevronDownIcon, SearchIcon, InputText, IconField, InputIcon, Scroller, SharedModule],
    template: `
        <span
            #focusInput
            [class]="cx('label')"
            *ngIf="!editable"
            [pTooltip]="tooltip"
            [tooltipPosition]="tooltipPosition"
            [positionStyle]="tooltipPositionStyle"
            [tooltipStyleClass]="tooltipStyleClass"
            [attr.aria-disabled]="$disabled()"
            [attr.id]="inputId"
            role="combobox"
            [attr.aria-label]="ariaLabel || (label() === 'p-emptylabel' ? undefined : label())"
            [attr.aria-labelledby]="ariaLabelledBy"
            [attr.aria-haspopup]="'listbox'"
            [attr.aria-expanded]="overlayVisible ?? false"
            [attr.aria-controls]="overlayVisible ? id + '_list' : null"
            [attr.tabindex]="!$disabled() ? tabindex : -1"
            [pAutoFocus]="autofocus"
            [attr.aria-activedescendant]="focused ? focusedOptionId : undefined"
            (focus)="onInputFocus($event)"
            (blur)="onInputBlur($event)"
            (keydown)="onKeyDown($event)"
            [attr.aria-required]="required()"
            [attr.required]="required() ? '' : undefined"
            [attr.disabled]="$disabled() ? '' : undefined"
        >
            <ng-container *ngIf="!selectedItemTemplate && !_selectedItemTemplate; else defaultPlaceholder">{{ label() === 'p-emptylabel' ? '&nbsp;' : label() }}</ng-container>
            <ng-container *ngIf="(selectedItemTemplate || _selectedItemTemplate) && !isSelectedOptionEmpty()" [ngTemplateOutlet]="selectedItemTemplate || _selectedItemTemplate" [ngTemplateOutletContext]="{ $implicit: selectedOption }"></ng-container>
            <ng-template #defaultPlaceholder>
                <span *ngIf="isSelectedOptionEmpty()">{{ label() === 'p-emptylabel' ? '&nbsp;' : label() }}</span>
            </ng-template>
        </span>
        <input
            *ngIf="editable"
            #editableInput
            type="text"
            [attr.id]="inputId"
            [class]="cx('label')"
            [attr.aria-haspopup]="'listbox'"
            [attr.placeholder]="modelValue() === undefined || modelValue() === null ? placeholder() : undefined"
            [attr.aria-label]="ariaLabel || (label() === 'p-emptylabel' ? undefined : label())"
            (input)="onEditableInput($event)"
            (keydown)="onKeyDown($event)"
            [pAutoFocus]="autofocus"
            [attr.aria-activedescendant]="focused ? focusedOptionId : undefined"
            (focus)="onInputFocus($event)"
            (blur)="onInputBlur($event)"
            [attr.name]="name()"
            [attr.minlength]="minlength()"
            [attr.min]="min()"
            [attr.max]="max()"
            [attr.pattern]="pattern()"
            [attr.size]="inputSize()"
            [attr.maxlength]="maxlength()"
            [attr.required]="required() ? '' : undefined"
            [attr.readonly]="readonly ? '' : undefined"
            [attr.disabled]="$disabled() ? '' : undefined"
        />
        <ng-container *ngIf="isVisibleClearIcon">
            <svg data-p-icon="times" [class]="cx('clearIcon')" (click)="clear($event)" *ngIf="!clearIconTemplate && !_clearIconTemplate" [attr.data-pc-section]="'clearicon'" />
            <span [class]="cx('clearIcon')" (click)="clear($event)" *ngIf="clearIconTemplate || _clearIconTemplate" [attr.data-pc-section]="'clearicon'">
                <ng-template *ngTemplateOutlet="clearIconTemplate || _clearIconTemplate; context: { class: cx('clearIcon') }"></ng-template>
            </span>
        </ng-container>

        <div [class]="cx('dropdown')" role="button" aria-label="dropdown trigger" aria-haspopup="listbox" [attr.aria-expanded]="overlayVisible ?? false" [attr.data-pc-section]="'trigger'">
            <ng-container *ngIf="loading; else elseBlock">
                <ng-container *ngIf="loadingIconTemplate || _loadingIconTemplate">
                    <ng-container *ngTemplateOutlet="loadingIconTemplate || _loadingIconTemplate"></ng-container>
                </ng-container>
                <ng-container *ngIf="!loadingIconTemplate && !_loadingIconTemplate">
                    <span *ngIf="loadingIcon" [class]="cn(cx('loadingIcon'), 'pi-spin' + loadingIcon)" aria-hidden="true"></span>
                    <span *ngIf="!loadingIcon" [class]="cn(cx('loadingIcon'), 'pi pi-spinner pi-spin')" aria-hidden="true"></span>
                </ng-container>
            </ng-container>

            <ng-template #elseBlock>
                <ng-container *ngIf="!dropdownIconTemplate && !_dropdownIconTemplate">
                    <span [class]="cn(cx('dropdownIcon'), dropdownIcon)" *ngIf="dropdownIcon"></span>
                    <svg data-p-icon="chevron-down" *ngIf="!dropdownIcon" [class]="cx('dropdownIcon')" />
                </ng-container>
                <span *ngIf="dropdownIconTemplate || _dropdownIconTemplate" [class]="cx('dropdownIcon')">
                    <ng-template *ngTemplateOutlet="dropdownIconTemplate || _dropdownIconTemplate; context: { class: cx('dropdownIcon') }"></ng-template>
                </span>
            </ng-template>
        </div>

        <p-overlay #overlay [hostAttrSelector]="attrSelector" [(visible)]="overlayVisible" [options]="overlayOptions" [target]="'@parent'" [appendTo]="$appendTo()" (onAnimationStart)="onOverlayAnimationStart($event)" (onHide)="hide()">
            <ng-template #content>
                <div [class]="cn(cx('overlay'), panelStyleClass)" [ngStyle]="panelStyle">
                    <span
                        #firstHiddenFocusableEl
                        role="presentation"
                        class="p-hidden-accessible p-hidden-focusable"
                        [attr.tabindex]="0"
                        (focus)="onFirstHiddenFocus($event)"
                        [attr.data-p-hidden-accessible]="true"
                        [attr.data-p-hidden-focusable]="true"
                    >
                    </span>
                    <ng-container *ngTemplateOutlet="headerTemplate || _headerTemplate"></ng-container>
                    <div [class]="cx('header')" *ngIf="filter" (click)="$event.stopPropagation()">
                        <ng-container *ngIf="filterTemplate || _filterTemplate; else builtInFilterElement">
                            <ng-container *ngTemplateOutlet="filterTemplate || _filterTemplate; context: { options: filterOptions }"></ng-container>
                        </ng-container>
                        <ng-template #builtInFilterElement>
                            <p-iconfield>
                                <input
                                    #filter
                                    pInputText
                                    [pSize]="size()"
                                    type="text"
                                    role="searchbox"
                                    autocomplete="off"
                                    [value]="_filterValue() || ''"
                                    [class]="cx('pcFilter')"
                                    [variant]="$variant()"
                                    [attr.placeholder]="filterPlaceholder"
                                    [attr.aria-owns]="id + '_list'"
                                    (input)="onFilterInputChange($event)"
                                    [attr.aria-label]="ariaFilterLabel"
                                    [attr.aria-activedescendant]="focusedOptionId"
                                    (keydown)="onFilterKeyDown($event)"
                                    (blur)="onFilterBlur($event)"
                                />
                                <p-inputicon>
                                    <svg data-p-icon="search" *ngIf="!filterIconTemplate && !_filterIconTemplate" />
                                    <span *ngIf="filterIconTemplate || _filterIconTemplate">
                                        <ng-template *ngTemplateOutlet="filterIconTemplate || _filterIconTemplate"></ng-template>
                                    </span>
                                </p-inputicon>
                            </p-iconfield>
                        </ng-template>
                    </div>
                    <div [class]="cx('listContainer')" [style.max-height]="virtualScroll ? 'auto' : scrollHeight || 'auto'">
                        <p-scroller
                            *ngIf="virtualScroll"
                            #scroller
                            [items]="visibleOptions()"
                            [style]="{ height: scrollHeight }"
                            [itemSize]="virtualScrollItemSize"
                            [autoSize]="true"
                            [lazy]="lazy"
                            (onLazyLoad)="onLazyLoad.emit($event)"
                            [options]="virtualScrollOptions"
                        >
                            <ng-template #content let-items let-scrollerOptions="options">
                                <ng-container *ngTemplateOutlet="buildInItems; context: { $implicit: items, options: scrollerOptions }"></ng-container>
                            </ng-template>
                            <ng-container *ngIf="loaderTemplate || _loaderTemplate">
                                <ng-template #loader let-scrollerOptions="options">
                                    <ng-container *ngTemplateOutlet="loaderTemplate || _loaderTemplate; context: { options: scrollerOptions }"></ng-container>
                                </ng-template>
                            </ng-container>
                        </p-scroller>
                        <ng-container *ngIf="!virtualScroll">
                            <ng-container *ngTemplateOutlet="buildInItems; context: { $implicit: visibleOptions(), options: {} }"></ng-container>
                        </ng-container>

                        <ng-template #buildInItems let-items let-scrollerOptions="options">
                            <ul #items [attr.id]="id + '_list'" [attr.aria-label]="listLabel" [class]="cn(cx('list'), scrollerOptions.contentStyleClass)" [style]="scrollerOptions.contentStyle" role="listbox">
                                <ng-template ngFor let-option [ngForOf]="items" let-i="index">
                                    <ng-container *ngIf="isOptionGroup(option)">
                                        <li [class]="cx('optionGroup')" [attr.id]="id + '_' + getOptionIndex(i, scrollerOptions)" [ngStyle]="{ height: scrollerOptions.itemSize + 'px' }" role="option">
                                            <span *ngIf="!groupTemplate && !_groupTemplate">{{ getOptionGroupLabel(option.optionGroup) }}</span>
                                            <ng-container *ngTemplateOutlet="groupTemplate || _groupTemplate; context: { $implicit: option.optionGroup }"></ng-container>
                                        </li>
                                    </ng-container>
                                    <ng-container *ngIf="!isOptionGroup(option)">
                                        <p-selectItem
                                            [id]="id + '_' + getOptionIndex(i, scrollerOptions)"
                                            [option]="option"
                                            [checkmark]="checkmark"
                                            [selected]="isSelected(option)"
                                            [label]="getOptionLabel(option)"
                                            [disabled]="isOptionDisabled(option)"
                                            [template]="itemTemplate || _itemTemplate"
                                            [focused]="focusedOptionIndex() === getOptionIndex(i, scrollerOptions)"
                                            [ariaPosInset]="getAriaPosInset(getOptionIndex(i, scrollerOptions))"
                                            [ariaSetSize]="ariaSetSize"
                                            (onClick)="onOptionSelect($event, option)"
                                            (onMouseEnter)="onOptionMouseEnter($event, getOptionIndex(i, scrollerOptions))"
                                        ></p-selectItem>
                                    </ng-container>
                                </ng-template>
                                <li *ngIf="filterValue && isEmpty()" [class]="cx('emptyMessage')" [ngStyle]="{ height: scrollerOptions.itemSize + 'px' }" role="option">
                                    @if (!emptyFilterTemplate && !_emptyFilterTemplate && !emptyTemplate) {
                                        {{ emptyFilterMessageLabel }}
                                    } @else {
                                        <ng-container #emptyFilter *ngTemplateOutlet="emptyFilterTemplate || _emptyFilterTemplate || emptyTemplate || _emptyTemplate"></ng-container>
                                    }
                                </li>
                                <li *ngIf="!filterValue && isEmpty()" [class]="cx('emptyMessage')" [ngStyle]="{ height: scrollerOptions.itemSize + 'px' }" role="option">
                                    @if (!emptyTemplate && !_emptyTemplate) {
                                        {{ emptyMessageLabel }}
                                    } @else {
                                        <ng-container #empty *ngTemplateOutlet="emptyTemplate || _emptyTemplate"></ng-container>
                                    }
                                </li>
                            </ul>
                        </ng-template>
                    </div>
                    <ng-container *ngTemplateOutlet="footerTemplate || _footerTemplate"></ng-container>
                    <span
                        #lastHiddenFocusableEl
                        role="presentation"
                        class="p-hidden-accessible p-hidden-focusable"
                        [attr.tabindex]="0"
                        (focus)="onLastHiddenFocus($event)"
                        [attr.data-p-hidden-accessible]="true"
                        [attr.data-p-hidden-focusable]="true"
                    ></span>
                </div>
            </ng-template>
        </p-overlay>
    `,
    host: {
        '[class]': "cn(cx('root'), styleClass)",
        '[attr.id]': 'id',
        '(click)': 'onContainerClick($event)'
    },
    providers: [SELECT_VALUE_ACCESSOR, SelectStyle],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class Select extends BaseInput implements OnInit, AfterViewInit, AfterContentInit, AfterViewChecked {
    /**
     * Unique identifier of the component
     * @group Props
     */
    @Input() id: string | undefined;
    /**
     * Height of the viewport in pixels, a scrollbar is defined if height of list exceeds this value.
     * @group Props
     */
    @Input() scrollHeight: string = '200px';
    /**
     * When specified, displays an input field to filter the items on keyup.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) filter: boolean | undefined;
    /**
     * Inline style of the overlay panel element.
     * @group Props
     */
    @Input() panelStyle: { [klass: string]: any } | null | undefined;
    /**
     * Style class of the element.
     * @deprecated since v20.0.0, use `class` instead.
     * @group Props
     */
    @Input() styleClass: string | undefined;
    /**
     * Style class of the overlay panel element.
     * @group Props
     */
    @Input() panelStyleClass: string | undefined;
    /**
     * When present, it specifies that the component cannot be edited.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) readonly: boolean | undefined;
    /**
     * When present, custom value instead of predefined options can be entered using the editable input field.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) editable: boolean | undefined;
    /**
     * Index of the element in tabbing order.
     * @group Props
     */
    @Input({ transform: numberAttribute }) tabindex: number | undefined = 0;
    /**
     * Default text to display when no option is selected.
     * @group Props
     */
    @Input() set placeholder(val: string | undefined) {
        this._placeholder.set(val);
    }
    get placeholder(): Signal<string | undefined> {
        return this._placeholder.asReadonly();
    }
    /**
     * Icon to display in loading state.
     * @group Props
     */
    @Input() loadingIcon: string | undefined;
    /**
     * Placeholder text to show when filter input is empty.
     * @group Props
     */
    @Input() filterPlaceholder: string | undefined;
    /**
     * Locale to use in filtering. The default locale is the host environment's current locale.
     * @group Props
     */
    @Input() filterLocale: string | undefined;
    /**
     * Identifier of the accessible input element.
     * @group Props
     */
    @Input() inputId: string | undefined;
    /**
     * A property to uniquely identify a value in options.
     * @group Props
     */
    @Input() dataKey: string | undefined;
    /**
     * When filtering is enabled, filterBy decides which field or fields (comma separated) to search against.
     * @group Props
     */
    @Input() filterBy: string | undefined;
    /**
     * Fields used when filtering the options, defaults to optionLabel.
     * @group Props
     */
    @Input() filterFields: any[] | undefined;
    /**
     * When present, it specifies that the component should automatically get focus on load.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) autofocus: boolean | undefined;
    /**
     * Clears the filter value when hiding the select.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) resetFilterOnHide: boolean = false;
    /**
     * Whether the selected option will be shown with a check mark.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) checkmark: boolean = false;
    /**
     * Icon class of the select icon.
     * @group Props
     */
    @Input() dropdownIcon: string | undefined;
    /**
     * Whether the select is in loading state.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) loading: boolean | undefined = false;
    /**
     * Name of the label field of an option.
     * @group Props
     */
    @Input() optionLabel: string | undefined;
    /**
     * Name of the value field of an option.
     * @group Props
     */
    @Input() optionValue: string | undefined;
    /**
     * Name of the disabled field of an option.
     * @group Props
     */
    @Input() optionDisabled: string | undefined;
    /**
     * Name of the label field of an option group.
     * @group Props
     */
    @Input() optionGroupLabel: string | undefined = 'label';
    /**
     * Name of the options field of an option group.
     * @group Props
     */
    @Input() optionGroupChildren: string = 'items';
    /**
     * Whether to display options as grouped when nested options are provided.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) group: boolean | undefined;
    /**
     * When enabled, a clear icon is displayed to clear the value.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) showClear: boolean | undefined;
    /**
     * Text to display when filtering does not return any results. Defaults to global value in i18n translation configuration.
     * @group Props
     */
    @Input() emptyFilterMessage: string = '';
    /**
     * Text to display when there is no data. Defaults to global value in i18n translation configuration.
     * @group Props
     */
    @Input() emptyMessage: string = '';
    /**
     * Defines if data is loaded and interacted with in lazy manner.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) lazy: boolean = false;
    /**
     * Whether the data should be loaded on demand during scroll.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) virtualScroll: boolean | undefined;
    /**
     * Height of an item in the list for VirtualScrolling.
     * @group Props
     */
    @Input({ transform: numberAttribute }) virtualScrollItemSize: number | undefined;
    /**
     * Whether to use the scroller feature. The properties of scroller component can be used like an object in it.
     * @group Props
     */
    @Input() virtualScrollOptions: ScrollerOptions | undefined;
    /**
     * Whether to use overlay API feature. The properties of overlay API can be used like an object in it.
     * @group Props
     */
    @Input() overlayOptions: OverlayOptions | undefined;
    /**
     * Defines a string that labels the filter input.
     * @group Props
     */
    @Input() ariaFilterLabel: string | undefined;
    /**
     * Used to define a aria label attribute the current element.
     * @group Props
     */
    @Input() ariaLabel: string | undefined;
    /**
     * Establishes relationships between the component and label(s) where its value should be one or more element IDs.
     * @group Props
     */
    @Input() ariaLabelledBy: string | undefined;
    /**
     * Defines how the items are filtered.
     * @group Props
     */
    @Input() filterMatchMode: 'contains' | 'startsWith' | 'endsWith' | 'equals' | 'notEquals' | 'in' | 'lt' | 'lte' | 'gt' | 'gte' = 'contains';
    /**
     * Advisory information to display in a tooltip on hover.
     * @group Props
     */
    @Input() tooltip: string = '';
    /**
     * Position of the tooltip.
     * @group Props
     */
    @Input() tooltipPosition: 'top' | 'left' | 'right' | 'bottom' = 'right';
    /**
     * Type of CSS position.
     * @group Props
     */
    @Input() tooltipPositionStyle: string = 'absolute';
    /**
     * Style class of the tooltip.
     * @group Props
     */
    @Input() tooltipStyleClass: string | undefined;
    /**
     * Fields used when filtering the options, defaults to optionLabel.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) focusOnHover: boolean = true;
    /**
     * Determines if the option will be selected on focus.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) selectOnFocus: boolean = false;
    /**
     * Whether to focus on the first visible or selected element when the overlay panel is shown.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) autoOptionFocus: boolean = false;
    /**
     * Applies focus to the filter element when the overlay is shown.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) autofocusFilter: boolean = true;
    /**
     * When specified, filter displays with this value.
     * @group Props
     */
    @Input() get filterValue(): string | undefined | null {
        return this._filterValue();
    }
    set filterValue(val: string | undefined | null) {
        setTimeout(() => {
            this._filterValue.set(val);
        });
    }
    /**
     * An array of objects to display as the available options.
     * @group Props
     */
    @Input() get options(): any[] | undefined {
        const options = this._options();
        return options;
    }
    set options(val: any[] | undefined) {
        if (!deepEquals(val, this._options())) {
            this._options.set(val);
        }
    }
    /**
     * Target element to attach the overlay, valid values are "body" or a local ng-template variable of another element (note: use binding with brackets for template variables, e.g. [appendTo]="mydiv" for a div element having #mydiv as variable name).
     * @defaultValue 'self'
     * @group Props
     */
    appendTo = input<HTMLElement | ElementRef | TemplateRef<any> | 'self' | 'body' | null | undefined | any>(undefined);
    /**
     * Callback to invoke when value of select changes.
     * @param {SelectChangeEvent} event - custom change event.
     * @group Emits
     */
    @Output() onChange: EventEmitter<SelectChangeEvent> = new EventEmitter<SelectChangeEvent>();
    /**
     * Callback to invoke when data is filtered.
     * @param {SelectFilterEvent} event - custom filter event.
     * @group Emits
     */
    @Output() onFilter: EventEmitter<SelectFilterEvent> = new EventEmitter<SelectFilterEvent>();
    /**
     * Callback to invoke when select gets focus.
     * @param {Event} event - Browser event.
     * @group Emits
     */
    @Output() onFocus: EventEmitter<Event> = new EventEmitter<Event>();
    /**
     * Callback to invoke when select loses focus.
     * @param {Event} event - Browser event.
     * @group Emits
     */
    @Output() onBlur: EventEmitter<Event> = new EventEmitter<Event>();
    /**
     * Callback to invoke when component is clicked.
     * @param {MouseEvent} event - Mouse event.
     * @group Emits
     */
    @Output() onClick: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();
    /**
     * Callback to invoke when select overlay gets visible.
     * @param {AnimationEvent} event - Animation event.
     * @group Emits
     */
    @Output() onShow: EventEmitter<AnimationEvent> = new EventEmitter<AnimationEvent>();
    /**
     * Callback to invoke when select overlay gets hidden.
     * @param {AnimationEvent} event - Animation event.
     * @group Emits
     */
    @Output() onHide: EventEmitter<AnimationEvent> = new EventEmitter<AnimationEvent>();
    /**
     * Callback to invoke when select clears the value.
     * @param {Event} event - Browser event.
     * @group Emits
     */
    @Output() onClear: EventEmitter<Event> = new EventEmitter<Event>();
    /**
     * Callback to invoke in lazy mode to load new data.
     * @param {SelectLazyLoadEvent} event - Lazy load event.
     * @group Emits
     */
    @Output() onLazyLoad: EventEmitter<SelectLazyLoadEvent> = new EventEmitter<SelectLazyLoadEvent>();

    _componentStyle = inject(SelectStyle);

    @ViewChild('filter') filterViewChild: Nullable<ElementRef>;

    @ViewChild('focusInput') focusInputViewChild: Nullable<ElementRef>;

    @ViewChild('editableInput') editableInputViewChild: Nullable<ElementRef>;

    @ViewChild('items') itemsViewChild: Nullable<ElementRef>;

    @ViewChild('scroller') scroller: Nullable<Scroller>;

    @ViewChild('overlay') overlayViewChild: Nullable<Overlay>;

    @ViewChild('firstHiddenFocusableEl') firstHiddenFocusableElementOnOverlay: Nullable<ElementRef>;

    @ViewChild('lastHiddenFocusableEl') lastHiddenFocusableElementOnOverlay: Nullable<ElementRef>;

    itemsWrapper: Nullable<HTMLDivElement>;

    $appendTo = computed(() => this.appendTo() || this.config.overlayAppendTo());

    /**
     * Custom item template.
     * @group Templates
     */
    @ContentChild('item', { descendants: false }) itemTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom group template.
     * @group Templates
     */
    @ContentChild('group', { descendants: false }) groupTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom loader template.
     * @group Templates
     */
    @ContentChild('loader', { descendants: false }) loaderTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom selected item template.
     * @group Templates
     */
    @ContentChild('selectedItem', { descendants: false }) selectedItemTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom header template.
     * @group Templates
     */
    @ContentChild('header', { descendants: false }) headerTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom filter template.
     * @group Templates
     */
    @ContentChild('filter', { descendants: false }) filterTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom footer template.
     * @group Templates
     */
    @ContentChild('footer', { descendants: false }) footerTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom empty filter template.
     * @group Templates
     */
    @ContentChild('emptyfilter', { descendants: false }) emptyFilterTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom empty template.
     * @group Templates
     */
    @ContentChild('empty', { descendants: false }) emptyTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom dropdown icon template.
     * @group Templates
     */
    @ContentChild('dropdownicon', { descendants: false }) dropdownIconTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom loading icon template.
     * @group Templates
     */
    @ContentChild('loadingicon', { descendants: false }) loadingIconTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom clear icon template.
     * @group Templates
     */
    @ContentChild('clearicon', { descendants: false }) clearIconTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom filter icon template.
     * @group Templates
     */
    @ContentChild('filtericon', { descendants: false }) filterIconTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom on icon template.
     * @group Templates
     */
    @ContentChild('onicon', { descendants: false }) onIconTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom off icon template.
     * @group Templates
     */
    @ContentChild('officon', { descendants: false }) offIconTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom cancel icon template.
     * @group Templates
     */
    @ContentChild('cancelicon', { descendants: false }) cancelIconTemplate: Nullable<TemplateRef<any>>;

    @ContentChildren(PrimeTemplate) templates: QueryList<PrimeTemplate> | undefined;

    _itemTemplate: TemplateRef<any> | undefined;

    _selectedItemTemplate: TemplateRef<any> | undefined;

    _headerTemplate: TemplateRef<any> | undefined;

    _filterTemplate: TemplateRef<any> | undefined;

    _footerTemplate: TemplateRef<any> | undefined;

    _emptyFilterTemplate: TemplateRef<any> | undefined;

    _emptyTemplate: TemplateRef<any> | undefined;

    _groupTemplate: TemplateRef<any> | undefined;

    _loaderTemplate: TemplateRef<any> | undefined;

    _dropdownIconTemplate: TemplateRef<any> | undefined;

    _loadingIconTemplate: TemplateRef<any> | undefined;

    _clearIconTemplate: TemplateRef<any> | undefined;

    _filterIconTemplate: TemplateRef<any> | undefined;

    _cancelIconTemplate: TemplateRef<any> | undefined;

    _onIconTemplate: TemplateRef<any> | undefined;

    _offIconTemplate: TemplateRef<any> | undefined;

    filterOptions: SelectFilterOptions | undefined;

    _options = signal<any[] | undefined>(null);

    _placeholder = signal<string | undefined>(undefined);

    value: any;

    hover: Nullable<boolean>;

    focused: Nullable<boolean>;

    overlayVisible: Nullable<boolean>;

    optionsChanged: Nullable<boolean>;

    panel: Nullable<HTMLDivElement>;

    dimensionsUpdated: Nullable<boolean>;

    hoveredItem: any;

    selectedOptionUpdated: Nullable<boolean>;

    _filterValue = signal<any>(null);

    searchValue: Nullable<string>;

    searchIndex: Nullable<number>;

    searchTimeout: any;

    previousSearchChar: Nullable<string>;

    currentSearchChar: Nullable<string>;

    preventModelTouched: Nullable<boolean>;

    focusedOptionIndex = signal<number>(-1);

    labelId: Nullable<string>;

    listId: Nullable<string>;

    clicked = signal<boolean>(false);

    get emptyMessageLabel(): string {
        return this.emptyMessage || this.config.getTranslation(TranslationKeys.EMPTY_MESSAGE);
    }

    get emptyFilterMessageLabel(): string {
        return this.emptyFilterMessage || this.config.getTranslation(TranslationKeys.EMPTY_FILTER_MESSAGE);
    }

    get isVisibleClearIcon(): boolean | undefined {
        return this.modelValue() != null && this.hasSelectedOption() && this.showClear && !this.$disabled();
    }

    get listLabel(): string {
        return this.config.getTranslation(TranslationKeys.ARIA)['listLabel'];
    }

    get focusedOptionId() {
        return this.focusedOptionIndex() !== -1 ? `${this.id}_${this.focusedOptionIndex()}` : null;
    }

    visibleOptions = computed(() => {
        const options = this.getAllVisibleAndNonVisibleOptions();

        if (this._filterValue()) {
            const _filterBy = this.filterBy || this.optionLabel;

            const filteredOptions =
                !_filterBy && !this.filterFields && !this.optionValue
                    ? this.options.filter((option) => {
                          if (option.label) {
                              return option.label.toString().toLowerCase().indexOf(this._filterValue().toLowerCase().trim()) !== -1;
                          }
                          return option.toString().toLowerCase().indexOf(this._filterValue().toLowerCase().trim()) !== -1;
                      })
                    : this.filterService.filter(options, this.searchFields(), this._filterValue().trim(), this.filterMatchMode, this.filterLocale);

            if (this.group) {
                const optionGroups = this.options || [];
                const filtered = [];

                optionGroups.forEach((group) => {
                    const groupChildren = this.getOptionGroupChildren(group);
                    const filteredItems = groupChildren.filter((item) => filteredOptions.includes(item));

                    if (filteredItems.length > 0)
                        filtered.push({
                            ...group,
                            [typeof this.optionGroupChildren === 'string' ? this.optionGroupChildren : 'items']: [...filteredItems]
                        });
                });

                return this.flatOptions(filtered);
            }
            return filteredOptions;
        }

        return options;
    });

    label = computed(() => {
        // use  getAllVisibleAndNonVisibleOptions verses just visible options
        // this will find the selected option whether or not the user is currently filtering  because the filtered (i.e. visible) options, are a subset of all the options
        const options = this.getAllVisibleAndNonVisibleOptions();
        // use isOptionEqualsModelValue for the use case where the dropdown is initalized with a disabled option
        const selectedOptionIndex = options.findIndex((option) => this.isOptionValueEqualsModelValue(option));

        return selectedOptionIndex !== -1 ? this.getOptionLabel(options[selectedOptionIndex]) : this.placeholder() || 'p-emptylabel';
    });

    selectedOption: any;

    constructor(
        public zone: NgZone,
        public filterService: FilterService
    ) {
        super();
        effect(() => {
            const modelValue = this.modelValue();
            const visibleOptions = this.visibleOptions();

            if (visibleOptions && isNotEmpty(visibleOptions)) {
                const selectedOptionIndex = this.findSelectedOptionIndex();

                if (selectedOptionIndex !== -1 || modelValue === undefined || (typeof modelValue === 'string' && modelValue.length === 0) || this.isModelValueNotSet() || this.editable) {
                    this.selectedOption = visibleOptions[selectedOptionIndex];
                }
            }

            if (isEmpty(visibleOptions) && (modelValue === undefined || this.isModelValueNotSet()) && isNotEmpty(this.selectedOption)) {
                this.selectedOption = null;
            }

            if (modelValue !== undefined && this.editable) {
                this.updateEditableLabel();
            }
            this.cd.markForCheck();
        });
    }

    private isModelValueNotSet(): boolean {
        return this.modelValue() === null && !this.isOptionValueEqualsModelValue(this.selectedOption);
    }

    private getAllVisibleAndNonVisibleOptions() {
        return this.group ? this.flatOptions(this.options) : this.options || [];
    }

    ngOnInit() {
        super.ngOnInit();
        this.id = this.id || uuid('pn_id_');
        this.autoUpdateModel();

        if (this.filterBy) {
            this.filterOptions = {
                filter: (value) => this.onFilterInputChange(value),
                reset: () => this.resetFilter()
            };
        }
    }

    ngAfterContentInit() {
        (this.templates as QueryList<PrimeTemplate>).forEach((item) => {
            switch (item.getType()) {
                case 'item':
                    this._itemTemplate = item.template;
                    break;

                case 'selectedItem':
                    this._selectedItemTemplate = item.template;
                    break;

                case 'header':
                    this._headerTemplate = item.template;
                    break;

                case 'filter':
                    this._filterTemplate = item.template;
                    break;

                case 'footer':
                    this._footerTemplate = item.template;
                    break;

                case 'emptyfilter':
                    this._emptyFilterTemplate = item.template;
                    break;

                case 'empty':
                    this._emptyTemplate = item.template;
                    break;

                case 'group':
                    this._groupTemplate = item.template;
                    break;

                case 'loader':
                    this._loaderTemplate = item.template;
                    break;

                case 'dropdownicon':
                    this._dropdownIconTemplate = item.template;
                    break;

                case 'loadingicon':
                    this._loadingIconTemplate = item.template;
                    break;

                case 'clearicon':
                    this._clearIconTemplate = item.template;
                    break;

                case 'filtericon':
                    this._filterIconTemplate = item.template;
                    break;

                case 'cancelicon':
                    this._cancelIconTemplate = item.template;
                    break;

                case 'onicon':
                    this._onIconTemplate = item.template;
                    break;

                case 'officon':
                    this._offIconTemplate = item.template;
                    break;

                default:
                    this._itemTemplate = item.template;
                    break;
            }
        });
    }

    ngAfterViewChecked() {
        if (this.optionsChanged && this.overlayVisible) {
            this.optionsChanged = false;

            this.zone.runOutsideAngular(() => {
                setTimeout(() => {
                    if (this.overlayViewChild) {
                        this.overlayViewChild.alignOverlay();
                    }
                }, 1);
            });
        }

        if (this.selectedOptionUpdated && this.itemsWrapper) {
            let selectedItem = <any>findSingle(this.overlayViewChild?.overlayViewChild?.nativeElement, 'li.p-select-option-selected');
            if (selectedItem) {
                scrollInView(this.itemsWrapper, selectedItem);
            }
            this.selectedOptionUpdated = false;
        }
    }

    flatOptions(options) {
        return (options || []).reduce((result, option, index) => {
            result.push({ optionGroup: option, group: true, index });

            const optionGroupChildren = this.getOptionGroupChildren(option);

            optionGroupChildren && optionGroupChildren.forEach((o) => result.push(o));

            return result;
        }, []);
    }

    autoUpdateModel() {
        if (this.selectOnFocus && this.autoOptionFocus && !this.hasSelectedOption()) {
            this.focusedOptionIndex.set(this.findFirstFocusedOptionIndex());
            this.onOptionSelect(null, this.visibleOptions()[this.focusedOptionIndex()], false);
        }
    }

    onOptionSelect(event, option, isHide = true, preventChange = false) {
        if (!this.isSelected(option)) {
            const value = this.getOptionValue(option);
            this.updateModel(value, event);
            this.focusedOptionIndex.set(this.findSelectedOptionIndex());
            preventChange === false && this.onChange.emit({ originalEvent: event, value: value });
        }
        if (isHide) {
            this.hide(true);
        }
    }

    onOptionMouseEnter(event, index) {
        if (this.focusOnHover) {
            this.changeFocusedOptionIndex(event, index);
        }
    }

    updateModel(value, event?) {
        this.value = value;
        this.onModelChange(value);
        this.writeModelValue(value);
        this.selectedOptionUpdated = true;
    }

    allowModelChange() {
        return !!this.modelValue() && !this.placeholder() && (this.modelValue() === undefined || this.modelValue() === null) && !this.editable && this.options && this.options.length;
    }

    isSelected(option) {
        return this.isOptionValueEqualsModelValue(option);
    }

    private isOptionValueEqualsModelValue(option: any) {
        return this.isValidOption(option) && equals(this.modelValue(), this.getOptionValue(option), this.equalityKey());
    }

    ngAfterViewInit() {
        super.ngAfterViewInit();
        if (this.editable) {
            this.updateEditableLabel();
        }
        this.updatePlaceHolderForFloatingLabel();
    }

    updatePlaceHolderForFloatingLabel(): void {
        const parentElement = this.el.nativeElement.parentElement;
        const isInFloatingLabel = parentElement?.classList.contains('p-float-label');
        if (parentElement && isInFloatingLabel && !this.selectedOption) {
            const label = parentElement.querySelector('label');
            if (label) {
                this._placeholder.set(label.textContent);
            }
        }
    }

    updateEditableLabel(): void {
        if (this.editableInputViewChild) {
            this.editableInputViewChild.nativeElement.value = this.getOptionLabel(this.selectedOption) || this.modelValue() || '';
        }
    }

    clearEditableLabel(): void {
        if (this.editableInputViewChild) {
            this.editableInputViewChild.nativeElement.value = '';
        }
    }

    getOptionIndex(index, scrollerOptions) {
        return this.virtualScrollerDisabled ? index : scrollerOptions && scrollerOptions.getItemOptions(index)['index'];
    }

    getOptionLabel(option: any) {
        return this.optionLabel !== undefined && this.optionLabel !== null ? resolveFieldData(option, this.optionLabel) : option && option.label !== undefined ? option.label : option;
    }

    getOptionValue(option: any) {
        return this.optionValue && this.optionValue !== null ? resolveFieldData(option, this.optionValue) : !this.optionLabel && option && option.value !== undefined ? option.value : option;
    }

    isSelectedOptionEmpty() {
        return isEmpty(this.selectedOption);
    }

    isOptionDisabled(option: any) {
        if (this.getOptionValue(this.modelValue()) === this.getOptionValue(option) || (this.getOptionLabel(this.modelValue() === this.getOptionLabel(option)) && option.disabled === false)) {
            return false;
        } else {
            return this.optionDisabled ? resolveFieldData(option, this.optionDisabled) : option && option.disabled !== undefined ? option.disabled : false;
        }
    }

    getOptionGroupLabel(optionGroup: any) {
        return this.optionGroupLabel !== undefined && this.optionGroupLabel !== null ? resolveFieldData(optionGroup, this.optionGroupLabel) : optionGroup && optionGroup.label !== undefined ? optionGroup.label : optionGroup;
    }

    getOptionGroupChildren(optionGroup: any) {
        return this.optionGroupChildren !== undefined && this.optionGroupChildren !== null ? resolveFieldData(optionGroup, this.optionGroupChildren) : optionGroup.items;
    }

    getAriaPosInset(index) {
        return (
            (this.optionGroupLabel
                ? index -
                  this.visibleOptions()
                      .slice(0, index)
                      .filter((option) => this.isOptionGroup(option)).length
                : index) + 1
        );
    }

    get ariaSetSize() {
        return this.visibleOptions().filter((option) => !this.isOptionGroup(option)).length;
    }

    /**
     * Callback to invoke on filter reset.
     * @group Method
     */
    public resetFilter(): void {
        this._filterValue.set(null);

        if (this.filterViewChild && this.filterViewChild.nativeElement) {
            this.filterViewChild.nativeElement.value = '';
        }
    }

    onContainerClick(event: any) {
        if (this.$disabled() || this.readonly || this.loading) {
            return;
        }

        this.focusInputViewChild?.nativeElement.focus({ preventScroll: true });

        if (event.target.tagName === 'INPUT' || event.target.getAttribute('data-pc-section') === 'clearicon' || event.target.closest('[data-pc-section="clearicon"]')) {
            return;
        } else if (!this.overlayViewChild || !this.overlayViewChild.el.nativeElement.contains(event.target)) {
            this.overlayVisible ? this.hide(true) : this.show(true);
        }
        this.onClick.emit(event);
        this.clicked.set(true);
        this.cd.detectChanges();
    }

    isEmpty() {
        return !this._options() || (this.visibleOptions() && this.visibleOptions().length === 0);
    }

    onEditableInput(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.searchValue = '';
        const matched = this.searchOptions(event, value);
        !matched && this.focusedOptionIndex.set(-1);

        this.onModelChange(value);
        this.updateModel(value || null, event);
        setTimeout(() => {
            this.onChange.emit({ originalEvent: event, value: value });
        }, 1);

        !this.overlayVisible && isNotEmpty(value) && this.show();
    }
    /**
     * Displays the panel.
     * @group Method
     */
    public show(isFocus?) {
        this.overlayVisible = true;

        this.focusedOptionIndex.set(this.focusedOptionIndex() !== -1 ? this.focusedOptionIndex() : this.autoOptionFocus ? this.findFirstFocusedOptionIndex() : this.editable ? -1 : this.findSelectedOptionIndex());

        if (isFocus) {
            focus(this.focusInputViewChild?.nativeElement);
        }

        this.cd.markForCheck();
    }

    onOverlayAnimationStart(event: AnimationEvent) {
        if (event.toState === 'visible') {
            this.itemsWrapper = <any>findSingle(this.overlayViewChild?.overlayViewChild?.nativeElement, this.virtualScroll ? '.p-scroller' : '.p-select-list-container');
            this.virtualScroll && this.scroller?.setContentEl(this.itemsViewChild?.nativeElement);

            if (this.options && this.options.length) {
                if (this.virtualScroll) {
                    const selectedIndex = this.modelValue() ? this.focusedOptionIndex() : -1;
                    if (selectedIndex !== -1) {
                        this.scroller?.scrollToIndex(selectedIndex);
                    }
                } else {
                    let selectedListItem = findSingle(this.itemsWrapper, '.p-select-option.p-select-option-selected');
                    if (selectedListItem) {
                        selectedListItem.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                    }
                }
            }

            if (this.filterViewChild && this.filterViewChild.nativeElement) {
                this.preventModelTouched = true;

                if (this.autofocusFilter && !this.editable) {
                    this.filterViewChild.nativeElement.focus();
                }
            }
            this.onShow.emit(event);
        }
        if (event.toState === 'void') {
            this.itemsWrapper = null;
            this.onModelTouched();
            this.onHide.emit(event);
        }
    }
    /**
     * Hides the panel.
     * @group Method
     */
    public hide(isFocus?) {
        this.overlayVisible = false;
        this.focusedOptionIndex.set(-1);
        this.clicked.set(false);
        this.searchValue = '';

        if (this.overlayOptions?.mode === 'modal') {
            unblockBodyScroll();
        }
        if (this.filter && this.resetFilterOnHide) {
            this.resetFilter();
        }
        if (isFocus) {
            if (this.focusInputViewChild) {
                focus(this.focusInputViewChild?.nativeElement);
            }
            if (this.editable && this.editableInputViewChild) {
                focus(this.editableInputViewChild?.nativeElement);
            }
        }
        this.cd.markForCheck();
    }

    onInputFocus(event: Event) {
        if (this.$disabled()) {
            // For ScreenReaders
            return;
        }

        this.focused = true;
        const focusedOptionIndex = this.focusedOptionIndex() !== -1 ? this.focusedOptionIndex() : this.overlayVisible && this.autoOptionFocus ? this.findFirstFocusedOptionIndex() : -1;
        this.focusedOptionIndex.set(focusedOptionIndex);
        this.overlayVisible && this.scrollInView(this.focusedOptionIndex());

        this.onFocus.emit(event);
    }

    onInputBlur(event: Event) {
        this.focused = false;
        this.onBlur.emit(event);

        if (!this.preventModelTouched) {
            this.onModelTouched();
        }
        this.preventModelTouched = false;
    }

    onKeyDown(event: KeyboardEvent, search: boolean = false) {
        if (this.$disabled() || this.readonly || this.loading) {
            return;
        }

        switch (event.code) {
            //down
            case 'ArrowDown':
                this.onArrowDownKey(event);
                break;

            //up
            case 'ArrowUp':
                this.onArrowUpKey(event, this.editable);
                break;

            case 'ArrowLeft':
            case 'ArrowRight':
                this.onArrowLeftKey(event, this.editable);
                break;

            case 'Delete':
                this.onDeleteKey(event);
                break;

            case 'Home':
                this.onHomeKey(event, this.editable);
                break;

            case 'End':
                this.onEndKey(event, this.editable);
                break;

            case 'PageDown':
                this.onPageDownKey(event);
                break;

            case 'PageUp':
                this.onPageUpKey(event);
                break;

            //space
            case 'Space':
                this.onSpaceKey(event, search);
                break;

            //enter
            case 'Enter':
            case 'NumpadEnter':
                this.onEnterKey(event);
                break;

            //escape and tab
            case 'Escape':
                this.onEscapeKey(event);
                break;

            case 'Tab':
                this.onTabKey(event);
                break;

            case 'Backspace':
                this.onBackspaceKey(event, this.editable);
                break;

            case 'ShiftLeft':
            case 'ShiftRight':
                //NOOP
                break;

            default:
                if (!event.metaKey && isPrintableCharacter(event.key)) {
                    !this.overlayVisible && this.show();
                    !this.editable && this.searchOptions(event, event.key);
                }

                break;
        }

        this.clicked.set(false);
    }

    onFilterKeyDown(event) {
        switch (event.code) {
            case 'ArrowDown':
                this.onArrowDownKey(event);
                break;

            case 'ArrowUp':
                this.onArrowUpKey(event, true);
                break;

            case 'ArrowLeft':
            case 'ArrowRight':
                this.onArrowLeftKey(event, true);
                break;

            case 'Home':
                this.onHomeKey(event, true);
                break;

            case 'End':
                this.onEndKey(event, true);
                break;

            case 'Enter':
            case 'NumpadEnter':
                this.onEnterKey(event, true);
                break;

            case 'Escape':
                this.onEscapeKey(event);
                break;

            case 'Tab':
                this.onTabKey(event, true);
                break;

            default:
                break;
        }
    }

    onFilterBlur(event) {
        this.focusedOptionIndex.set(-1);
    }

    onArrowDownKey(event: KeyboardEvent) {
        if (!this.overlayVisible) {
            this.show();
            this.editable && this.changeFocusedOptionIndex(event, this.findSelectedOptionIndex());
        } else {
            const optionIndex = this.focusedOptionIndex() !== -1 ? this.findNextOptionIndex(this.focusedOptionIndex()) : this.clicked() ? this.findFirstOptionIndex() : this.findFirstFocusedOptionIndex();

            this.changeFocusedOptionIndex(event, optionIndex);
        }
        // const optionIndex = this.focusedOptionIndex() !== -1 ? this.findNextOptionIndex(this.focusedOptionIndex()) : this.findFirstFocusedOptionIndex();
        // this.changeFocusedOptionIndex(event, optionIndex);

        // !this.overlayVisible && this.show();
        event.preventDefault();
        event.stopPropagation();
    }

    changeFocusedOptionIndex(event, index) {
        if (this.focusedOptionIndex() !== index) {
            this.focusedOptionIndex.set(index);
            this.scrollInView();

            if (this.selectOnFocus) {
                const option = this.visibleOptions()[index];
                this.onOptionSelect(event, option, false);
            }
        }
    }

    get virtualScrollerDisabled() {
        return !this.virtualScroll;
    }

    scrollInView(index = -1) {
        const id = index !== -1 ? `${this.id}_${index}` : this.focusedOptionId;

        if (this.itemsViewChild && this.itemsViewChild.nativeElement) {
            const element = findSingle(this.itemsViewChild.nativeElement, `li[id="${id}"]`);
            if (element) {
                element.scrollIntoView && element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            } else if (!this.virtualScrollerDisabled) {
                setTimeout(() => {
                    this.virtualScroll && this.scroller?.scrollToIndex(index !== -1 ? index : this.focusedOptionIndex());
                }, 0);
            }
        }
    }

    hasSelectedOption() {
        return this.modelValue() !== undefined;
    }

    isValidSelectedOption(option) {
        return this.isValidOption(option) && this.isSelected(option);
    }

    equalityKey() {
        return this.optionValue ? null : this.dataKey;
    }

    findFirstFocusedOptionIndex() {
        const selectedIndex = this.findSelectedOptionIndex();
        return selectedIndex < 0 ? this.findFirstOptionIndex() : selectedIndex;
    }

    findFirstOptionIndex() {
        return this.visibleOptions().findIndex((option) => this.isValidOption(option));
    }

    findSelectedOptionIndex() {
        return this.hasSelectedOption() ? this.visibleOptions().findIndex((option) => this.isValidSelectedOption(option)) : -1;
    }

    findNextOptionIndex(index) {
        const matchedOptionIndex =
            index < this.visibleOptions().length - 1
                ? this.visibleOptions()
                      .slice(index + 1)
                      .findIndex((option) => this.isValidOption(option))
                : -1;
        return matchedOptionIndex > -1 ? matchedOptionIndex + index + 1 : index;
    }

    findPrevOptionIndex(index) {
        const matchedOptionIndex = index > 0 ? findLastIndex(this.visibleOptions().slice(0, index), (option) => this.isValidOption(option)) : -1;

        return matchedOptionIndex > -1 ? matchedOptionIndex : index;
    }

    findLastOptionIndex() {
        return findLastIndex(this.visibleOptions(), (option) => this.isValidOption(option));
    }

    findLastFocusedOptionIndex() {
        const selectedIndex = this.findSelectedOptionIndex();

        return selectedIndex < 0 ? this.findLastOptionIndex() : selectedIndex;
    }

    isValidOption(option) {
        return option !== undefined && option !== null && !(this.isOptionDisabled(option) || this.isOptionGroup(option));
    }

    isOptionGroup(option) {
        return this.optionGroupLabel !== undefined && this.optionGroupLabel !== null && option.optionGroup !== undefined && option.optionGroup !== null && option.group;
    }

    onArrowUpKey(event: KeyboardEvent, pressedInInputText: boolean = false) {
        if (event.altKey && !pressedInInputText) {
            if (this.focusedOptionIndex() !== -1) {
                const option = this.visibleOptions()[this.focusedOptionIndex()];
                this.onOptionSelect(event, option);
            }

            this.overlayVisible && this.hide();
        } else {
            const optionIndex = this.focusedOptionIndex() !== -1 ? this.findPrevOptionIndex(this.focusedOptionIndex()) : this.clicked() ? this.findLastOptionIndex() : this.findLastFocusedOptionIndex();

            this.changeFocusedOptionIndex(event, optionIndex);

            !this.overlayVisible && this.show();
        }
        event.preventDefault();
        event.stopPropagation();
    }

    onArrowLeftKey(event: KeyboardEvent, pressedInInputText: boolean = false) {
        pressedInInputText && this.focusedOptionIndex.set(-1);
    }

    onDeleteKey(event: KeyboardEvent) {
        if (this.showClear) {
            this.clear(event);
            event.preventDefault();
        }
    }

    onHomeKey(event: any, pressedInInputText: boolean = false) {
        if (pressedInInputText) {
            const target = event.currentTarget;
            if (event.shiftKey) {
                target.setSelectionRange(0, target.value.length);
            } else {
                target.setSelectionRange(0, 0);
                this.focusedOptionIndex.set(-1);
            }
        } else {
            this.changeFocusedOptionIndex(event, this.findFirstOptionIndex());

            !this.overlayVisible && this.show();
        }

        event.preventDefault();
    }

    onEndKey(event: any, pressedInInputText = false) {
        if (pressedInInputText) {
            const target = event.currentTarget;

            if (event.shiftKey) {
                target.setSelectionRange(0, target.value.length);
            } else {
                const len = target.value.length;

                target.setSelectionRange(len, len);
                this.focusedOptionIndex.set(-1);
            }
        } else {
            this.changeFocusedOptionIndex(event, this.findLastOptionIndex());

            !this.overlayVisible && this.show();
        }

        event.preventDefault();
    }

    onPageDownKey(event: KeyboardEvent) {
        this.scrollInView(this.visibleOptions().length - 1);
        event.preventDefault();
    }

    onPageUpKey(event: KeyboardEvent) {
        this.scrollInView(0);
        event.preventDefault();
    }

    onSpaceKey(event: KeyboardEvent, pressedInInputText: boolean = false) {
        !this.editable && !pressedInInputText && this.onEnterKey(event);
    }

    onEnterKey(event, pressedInInput = false) {
        if (!this.overlayVisible) {
            this.focusedOptionIndex.set(-1);
            this.onArrowDownKey(event);
        } else {
            if (this.focusedOptionIndex() !== -1) {
                const option = this.visibleOptions()[this.focusedOptionIndex()];
                this.onOptionSelect(event, option);
            }

            !pressedInInput && this.hide();
        }

        event.preventDefault();
    }

    onEscapeKey(event: KeyboardEvent) {
        this.overlayVisible && this.hide(true);
        event.preventDefault();
        event.stopPropagation();
    }

    onTabKey(event, pressedInInputText = false) {
        if (!pressedInInputText) {
            if (this.overlayVisible && this.hasFocusableElements()) {
                focus(event.shiftKey ? this.lastHiddenFocusableElementOnOverlay.nativeElement : this.firstHiddenFocusableElementOnOverlay.nativeElement);
                event.preventDefault();
            } else {
                if (this.focusedOptionIndex() !== -1 && this.overlayVisible) {
                    const option = this.visibleOptions()[this.focusedOptionIndex()];
                    this.onOptionSelect(event, option);
                }
                this.overlayVisible && this.hide(this.filter);
            }
        }
        event.stopPropagation();
    }

    onFirstHiddenFocus(event) {
        const focusableEl = event.relatedTarget === this.focusInputViewChild?.nativeElement ? getFirstFocusableElement(this.overlayViewChild.el?.nativeElement, ':not(.p-hidden-focusable)') : this.focusInputViewChild?.nativeElement;
        focus(focusableEl);
    }

    onLastHiddenFocus(event) {
        const focusableEl =
            event.relatedTarget === this.focusInputViewChild?.nativeElement ? getLastFocusableElement(this.overlayViewChild?.overlayViewChild?.nativeElement, ':not([data-p-hidden-focusable="true"])') : this.focusInputViewChild?.nativeElement;

        focus(focusableEl);
    }

    hasFocusableElements() {
        return getFocusableElements(this.overlayViewChild.overlayViewChild.nativeElement, ':not([data-p-hidden-focusable="true"])').length > 0;
    }

    onBackspaceKey(event: KeyboardEvent, pressedInInputText = false) {
        if (pressedInInputText) {
            !this.overlayVisible && this.show();
        }
    }

    searchFields() {
        return this.filterBy?.split(',') || this.filterFields || [this.optionLabel];
    }

    searchOptions(event, char) {
        this.searchValue = (this.searchValue || '') + char;

        let optionIndex = -1;
        let matched = false;

        optionIndex = this.visibleOptions().findIndex((option) => this.isOptionMatched(option));

        if (optionIndex !== -1) {
            matched = true;
        }

        if (optionIndex === -1 && this.focusedOptionIndex() === -1) {
            optionIndex = this.findFirstFocusedOptionIndex();
        }

        if (optionIndex !== -1) {
            setTimeout(() => {
                this.changeFocusedOptionIndex(event, optionIndex);
            });
        }

        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        this.searchTimeout = setTimeout(() => {
            this.searchValue = '';
            this.searchTimeout = null;
        }, 500);

        return matched;
    }

    isOptionMatched(option) {
        return this.isValidOption(option) && this.getOptionLabel(option).toString().toLocaleLowerCase(this.filterLocale).startsWith(this.searchValue.toLocaleLowerCase(this.filterLocale));
    }

    onFilterInputChange(event: Event | any): void {
        let value: string = (event.target as HTMLInputElement).value;
        this._filterValue.set(value);
        this.focusedOptionIndex.set(-1);
        this.onFilter.emit({ originalEvent: event, filter: this._filterValue() });
        !this.virtualScrollerDisabled && this.scroller.scrollToIndex(0);
        setTimeout(() => {
            this.overlayViewChild.alignOverlay();
        });
        this.cd.markForCheck();
    }

    applyFocus(): void {
        if (this.editable) (findSingle(this.el.nativeElement, '.p-dropdown-label.p-inputtext') as any).focus();
        else focus(this.focusInputViewChild?.nativeElement);
    }
    /**
     * Applies focus.
     * @group Method
     */
    public focus(): void {
        this.applyFocus();
    }
    /**
     * Clears the model.
     * @group Method
     */
    public clear(event?: Event) {
        this.updateModel(null, event);
        this.clearEditableLabel();
        this.onModelTouched();
        this.onChange.emit({ originalEvent: event, value: this.value });
        this.onClear.emit(event);
        this.resetFilter();
    }

    /**
     * @override
     *
     * @see {@link BaseEditableHolder.writeControlValue}
     * Writes the value to the control.
     */
    writeControlValue(value: any, setModelValue: (value: any) => void): void {
        if (this.filter) {
            this.resetFilter();
        }

        this.value = value;
        this.allowModelChange() && this.onModelChange(value);
        setModelValue(this.value);
        this.updateEditableLabel();
        this.cd.markForCheck();
    }
}

@NgModule({
    imports: [Select, SharedModule],
    exports: [Select, SharedModule]
})
export class SelectModule {}
