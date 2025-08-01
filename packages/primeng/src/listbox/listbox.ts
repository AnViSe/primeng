import { CDK_DRAG_CONFIG, CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
    AfterContentInit,
    ChangeDetectionStrategy,
    Component,
    ContentChild,
    ContentChildren,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    NgModule,
    OnDestroy,
    OnInit,
    Output,
    QueryList,
    TemplateRef,
    ViewChild,
    ViewEncapsulation,
    booleanAttribute,
    computed,
    forwardRef,
    inject,
    input,
    numberAttribute,
    signal
} from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { equals, findLastIndex, findSingle, focus, getFirstFocusableElement, isEmpty, isFunction, isNotEmpty, isPrintableCharacter, resolveFieldData, uuid } from '@primeuix/utils';
import { FilterService, Footer, Header, PrimeTemplate, ScrollerOptions, SharedModule } from 'primeng/api';
import { BaseEditableHolder } from 'primeng/baseeditableholder';
import { Checkbox } from 'primeng/checkbox';
import { IconField } from 'primeng/iconfield';
import { BlankIcon, CheckIcon, SearchIcon } from 'primeng/icons';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Ripple } from 'primeng/ripple';
import { Scroller, ScrollerLazyLoadEvent } from 'primeng/scroller';
import { Nullable } from 'primeng/ts-helpers';
import { Subscription } from 'rxjs';
import { ListboxChangeEvent, ListboxClickEvent, ListboxDoubleClickEvent, ListboxFilterEvent, ListboxFilterOptions, ListboxSelectAllChangeEvent } from './listbox.interface';
import { ListBoxStyle } from './style/listboxstyle';

export const LISTBOX_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => Listbox),
    multi: true
};
/**
 * ListBox is used to select one or more values from a list of items.
 * @group Components
 */
@Component({
    selector: 'p-listbox, p-listBox, p-list-box',
    standalone: true,
    imports: [CommonModule, Ripple, Scroller, InputIcon, SearchIcon, Checkbox, CheckIcon, IconField, InputText, BlankIcon, FormsModule, SharedModule, DragDropModule],
    template: `
        <span #firstHiddenFocusableElement role="presentation" class="p-hidden-accessible p-hidden-focusable" [tabindex]="!$disabled() ? tabindex : -1" (focus)="onFirstHiddenFocus($event)" [attr.data-p-hidden-focusable]="true"> </span>
        <div [class]="cx('header')" *ngIf="headerFacet || headerTemplate || _headerTemplate">
            <ng-content select="p-header"></ng-content>
            <ng-container *ngTemplateOutlet="headerTemplate || _headerTemplate; context: { $implicit: modelValue(), options: visibleOptions() }"></ng-container>
        </div>
        <div [class]="cx('header')" *ngIf="(checkbox && multiple && showToggleAll) || filter">
            <p-checkbox
                #headerchkbox
                (onChange)="onToggleAll($event)"
                *ngIf="checkbox && multiple"
                [class]="cx('optionCheckIcon')"
                [ngModel]="allSelected()"
                [disabled]="$disabled()"
                [tabindex]="-1"
                [variant]="config.inputStyle() === 'filled' || config.inputVariant() === 'filled' ? 'filled' : 'outlined'"
                [binary]="true"
                [attr.aria-label]="toggleAllAriaLabel"
            >
                <ng-container *ngIf="checkIconTemplate || _checkIconTemplate">
                    <ng-template #icon>
                        <ng-template *ngTemplateOutlet="checkIconTemplate || _checkIconTemplate; context: { $implicit: allSelected() }"></ng-template>
                    </ng-template>
                </ng-container>
            </p-checkbox>
            <ng-container *ngIf="filterTemplate || _filterTemplate; else builtInFilterElement">
                <ng-container *ngTemplateOutlet="filterTemplate || _filterTemplate; context: { options: filterOptions }"></ng-container>
            </ng-container>
            <ng-template #builtInFilterElement>
                <div *ngIf="filter">
                    <p-iconfield>
                        <input
                            #filterInput
                            pInputText
                            type="text"
                            [class]="cx('pcFilter')"
                            role="searchbox"
                            [value]="_filterValue() || ''"
                            [attr.disabled]="$disabled() ? '' : undefined"
                            [attr.aria-owns]="id + '_list'"
                            [attr.aria-activedescendant]="focusedOptionId"
                            [attr.placeholder]="filterPlaceHolder"
                            [attr.aria-label]="ariaFilterLabel"
                            [attr.tabindex]="!$disabled() && !focused ? tabindex : -1"
                            (input)="onFilterChange($event)"
                            (keydown)="onFilterKeyDown($event)"
                            (blur)="onFilterBlur($event)"
                        />
                        <p-inputicon>
                            <svg data-p-icon="search" *ngIf="!filterIconTemplate && !_filterIconTemplate" [attr.aria-hidden]="true" />
                            <span *ngIf="filterIconTemplate || _filterIconTemplate" [attr.aria-hidden]="true">
                                <ng-template *ngTemplateOutlet="filterIconTemplate || _filterIconTemplate"></ng-template>
                            </span>
                        </p-inputicon>
                    </p-iconfield>
                </div>
                <span role="status" [attr.aria-live]="'polite'" class="p-hidden-accessible" [attr.data-p-hidden-accessible]="true">
                    {{ filterResultMessageText }}
                </span>
            </ng-template>
        </div>
        <div #container [class]="cn(cx('listContainer'), listStyleClass)" [ngStyle]="listStyle" [style.max-height]="virtualScroll ? 'auto' : scrollHeight || 'auto'">
            @if (hasFilter() && isEmpty()) {
                <div [class]="cx('emptyMessage')" [cdkDropListData]="$any([])" (cdkDropListDropped)="drop($event)" cdkDropList>
                    @if (!emptyFilterTemplate && !_emptyFilterTemplate && !_emptyTemplate && !emptyTemplate) {
                        {{ emptyFilterMessageText }}
                    } @else {
                        <ng-container #emptyFilter *ngTemplateOutlet="emptyFilterTemplate || _emptyFilterTemplate || _emptyTemplate || emptyTemplate"></ng-container>
                    }
                </div>
            } @else if (!hasFilter() && isEmpty()) {
                <div [class]="cx('emptyMessage')" [cdkDropListData]="$any([])" (cdkDropListDropped)="drop($event)" cdkDropList>
                    @if (!emptyTemplate && !_emptyTemplate) {
                        {{ emptyMessage }}
                    } @else {
                        <ng-container #empty *ngTemplateOutlet="emptyTemplate || _emptyTemplate"></ng-container>
                    }
                </div>
            } @else {
                <p-scroller
                    #scroller
                    *ngIf="virtualScroll"
                    [items]="visibleOptions()"
                    [style]="{ height: scrollHeight }"
                    [itemSize]="virtualScrollItemSize"
                    [autoSize]="true"
                    [lazy]="lazy"
                    [options]="virtualScrollOptions"
                    (onLazyLoad)="onLazyLoad.emit($event)"
                    [tabindex]="scrollerTabIndex"
                >
                    <ng-template #content let-items let-scrollerOptions="options">
                        <ng-container *ngTemplateOutlet="buildInItems; context: { $implicit: items, options: scrollerOptions }"></ng-container>
                    </ng-template>
                    @if (loaderTemplate || _loaderTemplate) {
                        <ng-template #loader let-scrollerOptions="options">
                            <ng-container *ngTemplateOutlet="loaderTemplate || _loaderTemplate; context: { options: scrollerOptions }"></ng-container>
                        </ng-template>
                    }
                </p-scroller>
                <ng-container *ngIf="!virtualScroll">
                    <ng-container *ngTemplateOutlet="buildInItems; context: { $implicit: visibleOptions(), options: {} }"></ng-container>
                </ng-container>

                <ng-template #buildInItems let-items let-scrollerOptions="options">
                    <ul
                        [id]="id + '_list'"
                        [class]="cx('list')"
                        role="listbox"
                        [tabindex]="-1"
                        [attr.aria-multiselectable]="true"
                        [ngClass]="scrollerOptions.contentStyleClass"
                        [style]="scrollerOptions.contentStyle"
                        [attr.aria-activedescendant]="focused ? focusedOptionId : undefined"
                        [attr.aria-label]="ariaLabel"
                        [attr.aria-disabled]="$disabled()"
                        (focus)="onListFocus($event)"
                        (blur)="onListBlur($event)"
                        (keydown)="onListKeyDown($event)"
                        cdkDropList
                        [cdkDropListData]="items"
                        (cdkDropListDropped)="drop($event)"
                    >
                        <ng-template ngFor let-option [ngForOf]="items" let-i="index">
                            <ng-container *ngIf="isOptionGroup(option)">
                                <li
                                    [attr.id]="id + '_' + getOptionIndex(i, scrollerOptions)"
                                    [class]="cx('optionGroup')"
                                    [ngStyle]="{ height: scrollerOptions.itemSize + 'px' }"
                                    role="option"
                                    cdkDrag
                                    [cdkDragData]="option"
                                    [cdkDragDisabled]="!dragdrop"
                                >
                                    <span *ngIf="!groupTemplate && !_groupTemplate">{{ getOptionGroupLabel(option.optionGroup) }}</span>
                                    <ng-container *ngTemplateOutlet="groupTemplate || _groupTemplate; context: { $implicit: option.optionGroup }"></ng-container>
                                </li>
                            </ng-container>
                            <ng-container *ngIf="!isOptionGroup(option)">
                                <li
                                    pRipple
                                    [class]="cx('option', { option, i, scrollerOptions })"
                                    role="option"
                                    [attr.id]="id + '_' + getOptionIndex(i, scrollerOptions)"
                                    [ngStyle]="{ height: scrollerOptions.itemSize + 'px' }"
                                    [attr.aria-label]="getOptionLabel(option)"
                                    [attr.aria-selected]="isSelected(option)"
                                    [attr.aria-disabled]="isOptionDisabled(option)"
                                    [attr.aria-setsize]="ariaSetSize"
                                    [attr.ariaPosInset]="getAriaPosInset(getOptionIndex(i, scrollerOptions))"
                                    [attr.data-pc-section]="'item'"
                                    [attr.data-p-selected]="isSelected(option)"
                                    (click)="onOptionSelect($event, option, getOptionIndex(i, scrollerOptions))"
                                    (dblclick)="onOptionDoubleClick($event, option)"
                                    (mousedown)="onOptionMouseDown($event, getOptionIndex(i, scrollerOptions))"
                                    (mouseenter)="onOptionMouseEnter($event, getOptionIndex(i, scrollerOptions))"
                                    (touchend)="onOptionTouchEnd()"
                                    cdkDrag
                                    [cdkDragData]="option"
                                    [cdkDragDisabled]="!dragdrop"
                                >
                                    <p-checkbox
                                        *ngIf="checkbox && multiple"
                                        [class]="cx('optionCheckIcon')"
                                        [ngModel]="isSelected(option)"
                                        [readonly]="true"
                                        [disabled]="$disabled() || isOptionDisabled(option)"
                                        [tabindex]="-1"
                                        [variant]="config.inputStyle() === 'filled' || config.inputVariant() === 'filled' ? 'filled' : 'outlined'"
                                        [binary]="true"
                                    >
                                        <ng-container *ngIf="checkIconTemplate || _checkIconTemplate">
                                            <ng-template #icon>
                                                <ng-template *ngTemplateOutlet="checkIconTemplate || _checkIconTemplate; context: { $implicit: isSelected(option) }"></ng-template>
                                            </ng-template>
                                        </ng-container>
                                    </p-checkbox>
                                    <ng-container *ngIf="checkmark">
                                        <ng-container *ngIf="!checkmarkTemplate && !_checkmarkTemplate">
                                            <svg data-p-icon="blank" *ngIf="!isSelected(option)" [class]="cx('optionBlankIcon')" />
                                            <svg data-p-icon="check" *ngIf="isSelected(option)" [class]="cx('optionCheckIcon')" />
                                        </ng-container>
                                        <ng-container *ngTemplateOutlet="checkmarkTemplate || _checkmarkTemplate; context: { implicit: isSelected(option) }"></ng-container>
                                    </ng-container>
                                    <span *ngIf="!itemTemplate && !_itemTemplate">{{ getOptionLabel(option) }}</span>
                                    <ng-container
                                        *ngTemplateOutlet="
                                            itemTemplate || _itemTemplate;
                                            context: {
                                                $implicit: option,
                                                index: getOptionIndex(i, scrollerOptions),
                                                selected: isSelected(option),
                                                disabled: isOptionDisabled(option)
                                            }
                                        "
                                    ></ng-container>
                                </li>
                            </ng-container>
                        </ng-template>
                    </ul>
                </ng-template>
            }
        </div>
        <div *ngIf="footerFacet || footerTemplate || _footerTemplate">
            <ng-content select="p-footer"></ng-content>
            <ng-container *ngTemplateOutlet="footerTemplate || _footerTemplate; context: { $implicit: modelValue(), options: visibleOptions() }"></ng-container>
        </div>
        <span *ngIf="isEmpty()" role="status" aria-live="polite" class="p-hidden-accessible">
            {{ emptyMessage }}
        </span>
        <span role="status" aria-live="polite" class="p-hidden-accessible">
            {{ selectedMessageText }}
        </span>
        <span #lastHiddenFocusableElement role="presentation" class="p-hidden-accessible p-hidden-focusable" [tabindex]="!$disabled() ? tabindex : -1" (focus)="onLastHiddenFocus($event)" [attr.data-p-hidden-focusable]="true"> </span>
    `,
    providers: [
        LISTBOX_VALUE_ACCESSOR,
        ListBoxStyle,
        {
            provide: CDK_DRAG_CONFIG,
            useValue: {
                zIndex: 1200
            }
        }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    host: {
        '[attr.id]': 'id',
        '[class]': "cn(cx('root'), styleClass)"
    }
})
export class Listbox extends BaseEditableHolder implements AfterContentInit, OnInit, OnDestroy {
    /**
     * Unique identifier of the component.
     * @group Props
     */
    @Input() id: string | undefined;
    /**
     * Text to display when the search is active. Defaults to global value in i18n translation configuration.
     * @group Props
     * @defaultValue '{0} results are available'
     */
    @Input() searchMessage: string | undefined;
    /**
     * Text to display when filtering does not return any results. Defaults to global value in i18n translation configuration.
     * @group Props
     * @defaultValue 'No selected item'
     */
    @Input() emptySelectionMessage: string | undefined;
    /**
     * Text to be displayed in hidden accessible field when options are selected. Defaults to global value in i18n translation configuration.
     * @group Props
     * @defaultValue '{0} items selected'
     */
    @Input() selectionMessage: string | undefined;
    /**
     * Whether to focus on the first visible or selected element when the overlay panel is shown.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) autoOptionFocus: boolean | undefined = true;
    /**
     * Defines a string that labels the input for accessibility.
     * @group Props
     */
    @Input() ariaLabel: string | undefined;
    /**
     * When enabled, the focused option is selected.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) selectOnFocus: boolean | undefined;
    /**
     * Locale to use in searching. The default locale is the host environment's current locale.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) searchLocale: boolean | undefined;
    /**
     * When enabled, the hovered option will be focused.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) focusOnHover: boolean | undefined = true;
    /**
     * Text to display when filtering.
     * @group Props
     */
    @Input() filterMessage: string | undefined;
    /**
     * Fields used when filtering the options, defaults to optionLabel.
     * @group Props
     */
    @Input() filterFields: any[] | undefined;
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
     * Height of the viewport in pixels, a scrollbar is defined if height of list exceeds this value.
     * @group Props
     */
    @Input() scrollHeight: string = '14rem';
    /**
     * Index of the element in tabbing order.
     * @group Props
     */
    @Input({ transform: numberAttribute }) tabindex: number | undefined = 0;
    /**
     * When specified, allows selecting multiple values.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) multiple: boolean | undefined;
    /**
     * Style class of the container.
     * @deprecated since v20.0.0, use `class` instead.
     * @group Props
     */
    @Input() styleClass: string | undefined;
    /**
     * Inline style of the list element.
     * @group Props
     */
    @Input() listStyle: { [klass: string]: any } | null | undefined;
    /**
     * Style class of the list element.
     * @group Props
     */
    @Input() listStyleClass: string | undefined;
    /**
     * When present, it specifies that the element value cannot be changed.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) readonly: boolean | undefined;
    /**
     * When specified, allows selecting items with checkboxes.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) checkbox: boolean = false;
    /**
     * When specified, displays a filter input at header.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) filter: boolean = false;
    /**
     * When filtering is enabled, filterBy decides which field or fields (comma separated) to search against.
     * @group Props
     */
    @Input() filterBy: string | undefined;
    /**
     * Defines how the items are filtered.
     * @group Props
     */
    @Input() filterMatchMode: 'contains' | 'startsWith' | 'endsWith' | 'equals' | 'notEquals' | 'in' | 'lt' | 'lte' | 'gt' | 'gte' | string = 'contains';
    /**
     * Locale to use in filtering. The default locale is the host environment's current locale.
     * @group Props
     */
    @Input() filterLocale: string | undefined;
    /**
     * Defines how multiple items can be selected, when true metaKey needs to be pressed to select or unselect an item and when set to false selection of each item can be toggled individually. On touch enabled devices, metaKeySelection is turned off automatically.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) metaKeySelection: boolean = false;
    /**
     * A property to uniquely identify a value in options.
     * @group Props
     */
    @Input() dataKey: string | undefined;
    /**
     * Whether header checkbox is shown in multiple mode.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) showToggleAll: boolean = true;
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
     * Name of the options field of an option group.
     * @group Props
     */
    @Input() optionGroupChildren: string | undefined = 'items';
    /**
     * Name of the label field of an option group.
     * @group Props
     */
    @Input() optionGroupLabel: string | undefined = 'label';
    /**
     * Name of the disabled field of an option or function to determine disabled state.
     * @group Props
     */
    @Input() optionDisabled: string | ((item: any) => boolean) | undefined;
    /**
     * Defines a string that labels the filter input.
     * @group Props
     */
    @Input() ariaFilterLabel: string | undefined;
    /**
     * Defines placeholder of the filter input.
     * @group Props
     */
    @Input() filterPlaceHolder: string | undefined;
    /**
     * Text to display when filtering does not return any results.
     * @group Props
     */
    @Input() emptyFilterMessage: string | undefined;
    /**
     * Text to display when there is no data. Defaults to global value in i18n translation configuration.
     * @group Props
     */
    @Input() emptyMessage: string | undefined;
    /**
     * Whether to display options as grouped when nested options are provided.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) group: boolean | undefined;
    /**
     * An array of selectitems to display as the available options.
     * @group Props
     */
    @Input() get options(): any[] {
        return this._options();
    }
    set options(val: any[]) {
        this._options.set(val);
    }
    /**
     * When specified, filter displays with this value.
     * @group Props
     */
    @Input() get filterValue(): string {
        return this._filterValue();
    }
    set filterValue(val: string) {
        this._filterValue.set(val);
    }
    /**
     * Whether all data is selected.
     * @group Props
     */
    @Input() get selectAll(): boolean | undefined | null {
        return this._selectAll;
    }
    set selectAll(value: boolean | undefined | null) {
        this._selectAll = value;
    }
    /**
     * Whether to displays rows with alternating colors.
     * @group Props
     * @defaultValue false
     */
    @Input({ transform: booleanAttribute }) striped: boolean | undefined = false;
    /**
     * Whether the selected option will be add highlight class.
     * @group Props
     * @defaultValue true
     */
    @Input({ transform: booleanAttribute }) highlightOnSelect: boolean = true;
    /**
     * Whether the selected option will be shown with a check mark.
     * @group Props
     * @defaultValue false
     */
    @Input({ transform: booleanAttribute }) checkmark: boolean = false;
    /**
     * Whether to enable dragdrop based reordering.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) dragdrop: boolean = false;
    /**
     * Spans 100% width of the container when enabled.
     * @defaultValue undefined
     * @group Props
     */
    fluid = input(undefined, { transform: booleanAttribute });
    /**
     * Callback to invoke on value change.
     * @param {ListboxChangeEvent} event - Custom change event.
     * @group Emits
     */
    @Output() onChange: EventEmitter<ListboxChangeEvent> = new EventEmitter<ListboxChangeEvent>();
    /**
     * Callback to invoke when option is clicked.
     * @param {ListboxClickEvent} event - Custom click event.
     * @group Emits
     */
    @Output() onClick: EventEmitter<ListboxClickEvent> = new EventEmitter<ListboxClickEvent>();
    /**
     * Callback to invoke when option is double clicked.
     * @param {ListboxDoubleClickEvent} event - Custom double click event.
     * @group Emits
     */
    @Output() onDblClick: EventEmitter<ListboxDoubleClickEvent> = new EventEmitter<ListboxDoubleClickEvent>();
    /**
     * Callback to invoke when data is filtered.
     * @param {ListboxFilterEvent} event - Custom filter event.
     * @group Emits
     */
    @Output() onFilter: EventEmitter<ListboxFilterEvent> = new EventEmitter<ListboxFilterEvent>();
    /**
     * Callback to invoke when component receives focus.
     * @param {FocusEvent} event - Focus event.
     * @group Emits
     */
    @Output() onFocus: EventEmitter<FocusEvent> = new EventEmitter<FocusEvent>();
    /**
     * Callback to invoke when component loses focus.
     * @param {FocusEvent} event - Blur event.
     * @group Emits
     */
    @Output() onBlur: EventEmitter<FocusEvent> = new EventEmitter<FocusEvent>();
    /**
     * Callback to invoke when all data is selected.
     * @param {ListboxSelectAllChangeEvent} event - Custom select event.
     * @group Emits
     */
    @Output() onSelectAllChange: EventEmitter<ListboxSelectAllChangeEvent> = new EventEmitter<ListboxSelectAllChangeEvent>();
    /**
     * Emits on lazy load.
     * @param {ScrollerLazyLoadEvent} event - Scroller lazy load event.
     * @group Emits
     */
    @Output() onLazyLoad: EventEmitter<ScrollerLazyLoadEvent> = new EventEmitter<ScrollerLazyLoadEvent>();
    /**
     * Emits on item is dropped.
     * @param {CdkDragDrop<string[]>} event - Scroller lazy load event.
     * @group Emits
     */
    @Output() onDrop: EventEmitter<CdkDragDrop<string[]>> = new EventEmitter<CdkDragDrop<string[]>>();

    @ViewChild('headerchkbox') headerCheckboxViewChild: Nullable<ElementRef>;

    @ViewChild('filter') filterViewChild: Nullable<ElementRef>;

    @ViewChild('lastHiddenFocusableElement') lastHiddenFocusableElement: Nullable<ElementRef>;

    @ViewChild('firstHiddenFocusableElement') firstHiddenFocusableElement: Nullable<ElementRef>;

    @ViewChild('scroller') scroller: Nullable<Scroller>;

    @ViewChild('list') listViewChild: Nullable<ElementRef>;

    @ViewChild('container') containerViewChild: Nullable<ElementRef>;

    @ContentChild(Header) headerFacet: Nullable<TemplateRef<any>>;

    @ContentChild(Footer) footerFacet: Nullable<TemplateRef<any>>;

    /**
     * Custom item template.
     * @group Templates
     */
    @ContentChild('item', { descendants: false }) itemTemplate: TemplateRef<any> | undefined;

    /**
     * Custom group template.
     * @group Templates
     */
    @ContentChild('group', { descendants: false }) groupTemplate: TemplateRef<any> | undefined;

    /**
     * Custom header template.
     * @group Templates
     */
    @ContentChild('header', { descendants: false }) headerTemplate: TemplateRef<any> | undefined;

    /**
     * Custom filter template.
     * @group Templates
     */
    @ContentChild('filter', { descendants: false }) filterTemplate: TemplateRef<any> | undefined;

    /**
     * Custom footer template.
     * @group Templates
     */
    @ContentChild('footer', { descendants: false }) footerTemplate: TemplateRef<any> | undefined;

    /**
     * Custom empty filter message template.
     * @group Templates
     */
    @ContentChild('emptyfilter', { descendants: false }) emptyFilterTemplate: TemplateRef<any> | undefined;

    /**
     * Custom empty message template.
     * @group Templates
     */
    @ContentChild('empty', { descendants: false }) emptyTemplate: TemplateRef<any> | undefined;

    /**
     * Custom filter icon template.
     * @group Templates
     */
    @ContentChild('filtericon', { descendants: false }) filterIconTemplate: TemplateRef<any> | undefined;

    /**
     * Custom check icon template.
     * @group Templates
     */
    @ContentChild('checkicon', { descendants: false }) checkIconTemplate: TemplateRef<any> | undefined;

    /**
     * Custom checkmark icon template.
     * @group Templates
     */
    @ContentChild('checkmark', { descendants: false }) checkmarkTemplate: TemplateRef<any> | undefined;

    /**
     * Custom loader template.
     * @group Templates
     */
    @ContentChild('loader', { descendants: false }) loaderTemplate: TemplateRef<any> | undefined;

    @ContentChildren(PrimeTemplate) templates!: QueryList<PrimeTemplate>;

    _itemTemplate: TemplateRef<any> | undefined;

    _groupTemplate: TemplateRef<any> | undefined;

    _headerTemplate: TemplateRef<any> | undefined;

    _filterTemplate: TemplateRef<any> | undefined;

    _footerTemplate: TemplateRef<any> | undefined;

    _emptyFilterTemplate: TemplateRef<any> | undefined;

    _emptyTemplate: TemplateRef<any> | undefined;

    _filterIconTemplate: TemplateRef<any> | undefined;

    _checkIconTemplate: TemplateRef<any> | undefined;

    _checkmarkTemplate: TemplateRef<any> | undefined;

    _loaderTemplate: TemplateRef<any> | undefined;

    public _filterValue = signal<string | null | undefined>(null);

    public _filteredOptions: any[] | undefined | null;

    filterOptions: ListboxFilterOptions | undefined;

    public filtered: boolean | undefined | null;

    public value: any | undefined | null;

    public optionTouched: boolean | undefined | null;

    public focus: boolean | undefined | null;

    public headerCheckboxFocus: boolean | undefined | null;

    translationSubscription: Nullable<Subscription>;

    focused: boolean | undefined;

    scrollerTabIndex: string = '0';

    _componentStyle = inject(ListBoxStyle);

    get focusedOptionId() {
        return this.focusedOptionIndex() !== -1 ? `${this.id}_${this.focusedOptionIndex()}` : null;
    }

    get filterResultMessageText() {
        return isNotEmpty(this.visibleOptions()) ? this.filterMessageText.replaceAll('{0}', this.visibleOptions().length) : this.emptyFilterMessageText;
    }

    get filterMessageText() {
        return this.filterMessage || this.config.translation.searchMessage || '';
    }

    get searchMessageText() {
        return this.searchMessage || this.config.translation.searchMessage || '';
    }

    get emptyFilterMessageText() {
        return this.emptyFilterMessage || this.config.translation.emptySearchMessage || this.config.translation.emptyFilterMessage || '';
    }

    get selectionMessageText() {
        return this.selectionMessage || this.config.translation.selectionMessage || '';
    }

    get emptySelectionMessageText() {
        return this.emptySelectionMessage || this.config.translation.emptySelectionMessage || '';
    }

    get selectedMessageText() {
        return this.hasSelectedOption() ? this.selectionMessageText.replaceAll('{0}', this.multiple ? this.modelValue().length : '1') : this.emptySelectionMessageText;
    }

    get ariaSetSize() {
        return this.visibleOptions().filter((option) => !this.isOptionGroup(option)).length;
    }

    get virtualScrollerDisabled() {
        return !this.virtualScroll;
    }

    get searchFields() {
        return this.filterBy?.split(',') || this.filterFields || [this.optionLabel];
    }

    get toggleAllAriaLabel() {
        return this.config.translation.aria ? this.config.translation.aria[this.allSelected() ? 'selectAll' : 'unselectAll'] : undefined;
    }

    searchValue: string | undefined;

    searchTimeout: any;

    _selectAll: boolean | undefined | null = null;

    _options = signal<any>(null);

    startRangeIndex = signal<number>(-1);

    focusedOptionIndex = signal<number>(-1);

    @HostListener('focusout', ['$event'])
    onHostFocusOut(event: FocusEvent) {
        this.onFocusout(event);
    }

    visibleOptions = computed(() => {
        const options = this.group ? this.flatOptions(this._options()) : this._options() || [];
        return this._filterValue() ? this.filterService.filter(options, this.searchFields, this._filterValue(), this.filterMatchMode, this.filterLocale) : options;
    });

    constructor(public filterService: FilterService) {
        super();
    }

    ngOnInit() {
        super.ngOnInit();
        this.id = this.id || uuid('pn_id_');
        this.translationSubscription = this.config.translationObserver.subscribe(() => {
            this.cd.markForCheck();
        });

        this.autoUpdateModel();

        if (this.filterBy) {
            this.filterOptions = {
                filter: (value) => this.onFilterChange(value),
                reset: () => this.resetFilter()
            };
        }
    }

    ngAfterContentInit() {
        this.templates.forEach((item) => {
            switch (item.getType()) {
                case 'item':
                    this._itemTemplate = item.template;
                    break;

                case 'group':
                    this._groupTemplate = item.template;
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

                case 'empty':
                    this._emptyTemplate = item.template;
                    break;

                case 'emptyfilter':
                    this._emptyFilterTemplate = item.template;
                    break;

                case 'filtericon':
                    this._filterIconTemplate = item.template;
                    break;

                case 'checkicon':
                    this._checkIconTemplate = item.template;
                    break;

                case 'checkmark':
                    this._checkmarkTemplate = item.template;
                    break;

                case 'loader':
                    this._loaderTemplate = item.template;
                    break;

                default:
                    this._itemTemplate = item.template;
                    break;
            }
        });
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
        if (this.selectOnFocus && this.autoOptionFocus && !this.hasSelectedOption() && !this.multiple) {
            const focusedOptionIndex = this.findFirstFocusedOptionIndex();
            this.focusedOptionIndex.set(focusedOptionIndex);
            this.onOptionSelect(null, this.visibleOptions()[this.focusedOptionIndex()]);
        }
    }
    /**
     * Updates the model value.
     * @group Method
     */
    public updateModel(value, event?) {
        this.value = value;
        this.writeModelValue(value);
        this.onModelChange(value);

        this.onChange.emit({ originalEvent: event, value: this.value });
    }

    removeOption(option) {
        return this.modelValue().filter((val) => !equals(val, this.getOptionValue(option), this.equalityKey()));
    }

    onOptionSelect(event, option, index = -1) {
        if (this.$disabled() || this.isOptionDisabled(option) || this.readonly) {
            return;
        }

        event && this.onClick.emit({ originalEvent: event, option, value: this.value });
        this.multiple ? this.onOptionSelectMultiple(event, option) : this.onOptionSelectSingle(event, option);
        this.optionTouched = false;
        index !== -1 && this.focusedOptionIndex.set(index);
    }

    onOptionSelectMultiple(event, option) {
        let selected = this.isSelected(option);
        let value = null;
        let metaSelection = this.optionTouched ? false : this.metaKeySelection;

        if (metaSelection) {
            let metaKey = event.metaKey || event.ctrlKey;

            if (selected) {
                value = metaKey ? this.removeOption(option) : [this.getOptionValue(option)];
            } else {
                value = metaKey ? this.modelValue() || [] : [];
                value = [...value, this.getOptionValue(option)];
            }
        } else {
            value = selected ? this.removeOption(option) : [...(this.modelValue() || []), this.getOptionValue(option)];
        }

        this.updateModel(value, event);
    }

    onOptionSelectSingle(event, option) {
        let selected = this.isSelected(option);
        let valueChanged = false;
        let value = null;
        let metaSelection = this.optionTouched ? false : this.metaKeySelection;

        if (metaSelection) {
            let metaKey = event.metaKey || event.ctrlKey;

            if (selected) {
                if (metaKey) {
                    value = null;
                    valueChanged = true;
                }
            } else {
                value = this.getOptionValue(option);
                valueChanged = true;
            }
        } else {
            value = selected ? null : this.getOptionValue(option);
            valueChanged = true;
        }

        if (valueChanged) {
            this.updateModel(value, event);
        }
    }

    onOptionSelectRange(event, start = -1, end = -1) {
        start === -1 && (start = this.findNearestSelectedOptionIndex(end, true));
        end === -1 && (end = this.findNearestSelectedOptionIndex(start));

        if (start !== -1 && end !== -1) {
            const rangeStart = Math.min(start, end);
            const rangeEnd = Math.max(start, end);
            const value = this.visibleOptions()
                .slice(rangeStart, rangeEnd + 1)
                .filter((option) => this.isValidOption(option))
                .map((option) => this.getOptionValue(option));

            this.updateModel(value, event);
        }
    }

    onToggleAll(event) {
        if (this.$disabled() || this.readonly) {
            return;
        }
        focus(this.headerCheckboxViewChild.nativeElement);

        if (this.selectAll !== null) {
            this.onSelectAllChange.emit({
                originalEvent: event,
                checked: !this.allSelected()
            });
        } else {
            const value = this.allSelected()
                ? []
                : this.visibleOptions()
                      .filter((option) => this.isValidOption(option))
                      .map((option) => this.getOptionValue(option));

            this.updateModel(value, event);
            this.onChange.emit({ originalEvent: event, value: this.value });
        }
    }

    allSelected() {
        return this.selectAll !== null ? this.selectAll : isNotEmpty(this.visibleOptions()) && this.visibleOptions().every((option) => this.isOptionGroup(option) || this.isOptionDisabled(option) || this.isSelected(option));
    }

    onOptionTouchEnd() {
        if (this.$disabled()) {
            return;
        }

        this.optionTouched = true;
    }

    onOptionMouseDown(event: MouseEvent, index: number) {
        this.changeFocusedOptionIndex(event, index);
    }

    onOptionMouseEnter(event: MouseEvent, index: number) {
        if (this.focusOnHover && this.focused) {
            this.changeFocusedOptionIndex(event, index);
        }
    }

    onOptionDoubleClick(event: MouseEvent, option: any) {
        if (this.$disabled() || this.isOptionDisabled(option) || this.readonly) {
            return;
        }

        this.onDblClick.emit({
            originalEvent: event,
            option: option,
            value: this.value
        });
    }

    onFirstHiddenFocus(event: FocusEvent) {
        focus(this.listViewChild?.nativeElement);
        const firstFocusableEl = getFirstFocusableElement(this.el.nativeElement, ':not([data-p-hidden-focusable="true"])');
        this.lastHiddenFocusableElement.nativeElement.tabIndex = isEmpty(firstFocusableEl) ? '-1' : undefined;
        this.firstHiddenFocusableElement.nativeElement.tabIndex = -1;
    }

    onLastHiddenFocus(event: FocusEvent) {
        const relatedTarget = event.relatedTarget;

        if (relatedTarget === this.listViewChild?.nativeElement) {
            const firstFocusableEl = <any>getFirstFocusableElement(this.el.nativeElement, ':not(.p-hidden-focusable)');

            focus(firstFocusableEl);
            this.firstHiddenFocusableElement.nativeElement.tabIndex = undefined;
        } else {
            focus(this.firstHiddenFocusableElement.nativeElement);
        }
        this.lastHiddenFocusableElement.nativeElement.tabIndex = -1;
    }

    onFocusout(event: FocusEvent) {
        if (!this.el.nativeElement.contains(event.relatedTarget) && this.lastHiddenFocusableElement && this.firstHiddenFocusableElement) {
            this.firstHiddenFocusableElement.nativeElement.tabIndex = this.lastHiddenFocusableElement.nativeElement.tabIndex = undefined;
            this.scrollerTabIndex = '0';
        }
    }

    onListFocus(event: FocusEvent) {
        this.focused = true;
        const focusedOptionIndex = this.focusedOptionIndex() !== -1 ? this.focusedOptionIndex() : this.autoOptionFocus ? this.findFirstFocusedOptionIndex() : this.findSelectedOptionIndex();
        this.focusedOptionIndex.set(focusedOptionIndex);
        this.scrollInView(focusedOptionIndex);
        this.onFocus.emit(event);

        this.scrollerTabIndex = '-1';
    }

    onListBlur(event: FocusEvent) {
        this.focused = false;
        this.focusedOptionIndex.set(-1);
        this.startRangeIndex.set(-1);
        this.searchValue = '';
        this.onBlur.emit(event);
    }

    onHeaderCheckboxKeyDown(event) {
        if (this.$disabled()) {
            event.preventDefault();

            return;
        }

        switch (event.code) {
            case 'Space':
                this.onToggleAll(event);
                break;
            case 'Enter':
                this.onToggleAll(event);
                break;
            case 'Tab':
                this.onHeaderCheckboxTabKeyDown(event);
                break;
            default:
                break;
        }
    }

    onHeaderCheckboxTabKeyDown(event) {
        focus(this.listViewChild?.nativeElement);
        event.preventDefault();
    }

    onFilterChange(event: Event) {
        let value: string = (event.target as HTMLInputElement).value?.trim();
        this._filterValue.set(value);
        this.focusedOptionIndex.set(-1);
        this.startRangeIndex.set(-1);
        this.onFilter.emit({ originalEvent: event, filter: this._filterValue() });

        !this.virtualScrollerDisabled && this.scroller.scrollToIndex(0);
    }

    onFilterBlur(event: FocusEvent) {
        this.focusedOptionIndex.set(-1);
        this.startRangeIndex.set(-1);
    }

    onListKeyDown(event: KeyboardEvent) {
        const metaKey = event.metaKey || event.ctrlKey;

        switch (event.code) {
            case 'ArrowDown':
                this.onArrowDownKey(event);
                break;

            case 'ArrowUp':
                this.onArrowUpKey(event);
                break;

            case 'Home':
                this.onHomeKey(event);
                break;

            case 'End':
                this.onEndKey(event);
                break;

            case 'PageDown':
                this.onPageDownKey(event);
                break;

            case 'PageUp':
                this.onPageUpKey(event);
                break;

            case 'Enter':
            case 'Space':
            case 'NumpadEnter':
                this.onSpaceKey(event);
                break;

            case 'Tab':
                //NOOP
                break;

            case 'ShiftLeft':
            case 'ShiftRight':
                this.onShiftKey();
                break;

            default:
                if (this.multiple && event.code === 'KeyA' && metaKey) {
                    const value = this.visibleOptions()
                        .filter((option) => this.isValidOption(option))
                        .map((option) => this.getOptionValue(option));

                    this.updateModel(value, event);

                    event.preventDefault();
                    break;
                }

                if (!metaKey && isPrintableCharacter(event.key)) {
                    this.searchOptions(event, event.key);
                    event.preventDefault();
                }

                break;
        }
    }

    onFilterKeyDown(event: KeyboardEvent) {
        switch (event.code) {
            case 'ArrowDown':
                this.onArrowDownKey(event);
                break;

            case 'ArrowUp':
                this.onArrowUpKey(event);
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
                this.onEnterKey(event);
                break;

            case 'ShiftLeft':
            case 'ShiftRight':
                this.onShiftKey();
                break;

            default:
                break;
        }
    }

    onArrowDownKey(event: KeyboardEvent) {
        const optionIndex = this.focusedOptionIndex() !== -1 ? this.findNextOptionIndex(this.focusedOptionIndex()) : this.findFirstFocusedOptionIndex();

        if (this.multiple && event.shiftKey) {
            this.onOptionSelectRange(event, this.startRangeIndex(), optionIndex);
        }

        this.changeFocusedOptionIndex(event, optionIndex);
        event.preventDefault();
    }

    onArrowUpKey(event: KeyboardEvent) {
        const optionIndex = this.focusedOptionIndex() !== -1 ? this.findPrevOptionIndex(this.focusedOptionIndex()) : this.findLastFocusedOptionIndex();

        if (this.multiple && event.shiftKey) {
            this.onOptionSelectRange(event, optionIndex, this.startRangeIndex());
        }

        this.changeFocusedOptionIndex(event, optionIndex);
        event.preventDefault();
    }

    onArrowLeftKey(event: KeyboardEvent, pressedInInputText = false) {
        pressedInInputText && this.focusedOptionIndex.set(-1);
    }

    onHomeKey(event: KeyboardEvent, pressedInInputText: boolean = false) {
        if (pressedInInputText) {
            (event.currentTarget as HTMLInputElement).setSelectionRange(0, 0);
            this.focusedOptionIndex.set(-1);
        } else {
            let metaKey = event.metaKey || event.ctrlKey;
            let optionIndex = this.findFirstOptionIndex();

            if (this.multiple && event.shiftKey && metaKey) {
                this.onOptionSelectRange(event, optionIndex, this.startRangeIndex());
            }

            this.changeFocusedOptionIndex(event, optionIndex);
        }

        event.preventDefault();
    }

    onEndKey(event: KeyboardEvent, pressedInInputText: boolean = false) {
        if (pressedInInputText) {
            const target = event.currentTarget as HTMLInputElement;
            const len = target.value.length;

            target.setSelectionRange(len, len);
            this.focusedOptionIndex.set(-1);
        } else {
            let metaKey = event.metaKey || event.ctrlKey;
            let optionIndex = this.findLastOptionIndex();

            if (this.multiple && event.shiftKey && metaKey) {
                this.onOptionSelectRange(event, this.startRangeIndex(), optionIndex);
            }

            this.changeFocusedOptionIndex(event, optionIndex);
        }

        event.preventDefault();
    }

    onPageDownKey(event: KeyboardEvent) {
        this.scrollInView(0);
        event.preventDefault();
    }

    onPageUpKey(event: KeyboardEvent) {
        this.scrollInView(this.visibleOptions().length - 1);
        event.preventDefault();
    }

    onEnterKey(event) {
        if (this.focusedOptionIndex() !== -1) {
            if (this.multiple && event.shiftKey) this.onOptionSelectRange(event, this.focusedOptionIndex());
            else this.onOptionSelect(event, this.visibleOptions()[this.focusedOptionIndex()]);
        }

        event.preventDefault();
    }

    onSpaceKey(event: KeyboardEvent) {
        this.onEnterKey(event);
    }

    onShiftKey() {
        const focusedOptionIndex = this.focusedOptionIndex();
        this.startRangeIndex.set(focusedOptionIndex);
    }

    getOptionGroupChildren(optionGroup) {
        return this.optionGroupChildren ? resolveFieldData(optionGroup, this.optionGroupChildren) : optionGroup.items;
    }

    getOptionGroupLabel(optionGroup: any) {
        return this.optionGroupLabel ? resolveFieldData(optionGroup, this.optionGroupLabel) : optionGroup && optionGroup.label !== undefined ? optionGroup.label : optionGroup;
    }

    getOptionLabel(option) {
        return this.optionLabel ? resolveFieldData(option, this.optionLabel) : option.label != undefined ? option.label : option;
    }

    getOptionIndex(index, scrollerOptions) {
        return this.virtualScrollerDisabled ? index : scrollerOptions && scrollerOptions.getItemOptions(index)['index'];
    }

    getOptionValue(option: any) {
        return this.optionValue ? resolveFieldData(option, this.optionValue) : !this.optionLabel && option && option.value !== undefined ? option.value : option;
    }

    getAriaPosInset(index: number) {
        return (
            (this.optionGroupLabel
                ? index -
                  this.visibleOptions()
                      .slice(0, index)
                      .filter((option) => this.isOptionGroup(option)).length
                : index) + 1
        );
    }

    hasSelectedOption() {
        return isNotEmpty(this.modelValue());
    }

    isOptionGroup(option) {
        return this.optionGroupLabel && option.optionGroup && option.group;
    }

    changeFocusedOptionIndex(event, index) {
        if (this.focusedOptionIndex() !== index) {
            this.focusedOptionIndex.set(index);
            this.scrollInView();

            if (this.selectOnFocus && !this.multiple) {
                this.onOptionSelect(event, this.visibleOptions()[index]);
            }
        }
    }

    searchOptions(event, char) {
        this.searchValue = (this.searchValue || '') + char;

        let optionIndex = -1;
        let matched = false;

        if (this.focusedOptionIndex() !== -1) {
            optionIndex = this.visibleOptions()
                .slice(this.focusedOptionIndex())
                .findIndex((option) => this.isOptionMatched(option));
            optionIndex =
                optionIndex === -1
                    ? this.visibleOptions()
                          .slice(0, this.focusedOptionIndex())
                          .findIndex((option) => this.isOptionMatched(option))
                    : optionIndex + this.focusedOptionIndex();
        } else {
            optionIndex = this.visibleOptions().findIndex((option) => this.isOptionMatched(option));
        }

        if (optionIndex !== -1) {
            matched = true;
        }

        if (optionIndex === -1 && this.focusedOptionIndex() === -1) {
            optionIndex = this.findFirstFocusedOptionIndex();
        }

        if (optionIndex !== -1) {
            this.changeFocusedOptionIndex(event, optionIndex);
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
        return this.isValidOption(option) && this.getOptionLabel(option).toLocaleLowerCase(this.filterLocale).startsWith(this.searchValue.toLocaleLowerCase(this.filterLocale));
    }

    scrollInView(index = -1) {
        const id = index !== -1 ? `${this.id}_${index}` : this.focusedOptionId;
        const element = findSingle(this.listViewChild?.nativeElement, `li[id="${id}"]`);

        if (element) {
            element.scrollIntoView && element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        } else if (!this.virtualScrollerDisabled) {
            this.virtualScroll && this.scroller.scrollToIndex(index !== -1 ? index : this.focusedOptionIndex());
        }
    }

    findFirstOptionIndex() {
        return this.visibleOptions().findIndex((option) => this.isValidOption(option));
    }

    findLastOptionIndex() {
        return findLastIndex(this.visibleOptions(), (option) => this.isValidOption(option));
    }

    findFirstFocusedOptionIndex() {
        const selectedIndex = this.findFirstSelectedOptionIndex();

        return selectedIndex < 0 ? this.findFirstOptionIndex() : selectedIndex;
    }

    findLastFocusedOptionIndex() {
        const selectedIndex = this.findLastSelectedOptionIndex();

        return selectedIndex < 0 ? this.findLastOptionIndex() : selectedIndex;
    }

    findLastSelectedOptionIndex() {
        return this.hasSelectedOption() ? findLastIndex(this.visibleOptions(), (option) => this.isValidSelectedOption(option)) : -1;
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

    findNextSelectedOptionIndex(index) {
        const matchedOptionIndex =
            this.hasSelectedOption() && index < this.visibleOptions().length - 1
                ? this.visibleOptions()
                      .slice(index + 1)
                      .findIndex((option) => this.isValidSelectedOption(option))
                : -1;

        return matchedOptionIndex > -1 ? matchedOptionIndex + index + 1 : -1;
    }

    findPrevSelectedOptionIndex(index) {
        const matchedOptionIndex = this.hasSelectedOption() && index > 0 ? findLastIndex(this.visibleOptions().slice(0, index), (option) => this.isValidSelectedOption(option)) : -1;

        return matchedOptionIndex > -1 ? matchedOptionIndex : -1;
    }

    findFirstSelectedOptionIndex() {
        return this.hasSelectedOption() ? this.visibleOptions().findIndex((option) => this.isValidSelectedOption(option)) : -1;
    }

    findPrevOptionIndex(index) {
        const matchedOptionIndex = index > 0 ? findLastIndex(this.visibleOptions().slice(0, index), (option) => this.isValidOption(option)) : -1;

        return matchedOptionIndex > -1 ? matchedOptionIndex : index;
    }

    findSelectedOptionIndex() {
        if (this.$filled) {
            if (this.multiple) {
                for (let index = this.modelValue().length - 1; index >= 0; index--) {
                    const value = this.modelValue()[index];
                    const matchedOptionIndex = this.visibleOptions().findIndex((option) => this.isValidSelectedOption(option) && this.isEquals(value, this.getOptionValue(option)));

                    if (matchedOptionIndex > -1) return matchedOptionIndex;
                }
            } else {
                return this.visibleOptions().findIndex((option) => this.isValidSelectedOption(option));
            }
        }

        return -1;
    }

    findNearestSelectedOptionIndex(index, firstCheckUp = false) {
        let matchedOptionIndex = -1;

        if (this.hasSelectedOption()) {
            if (firstCheckUp) {
                matchedOptionIndex = this.findPrevSelectedOptionIndex(index);
                matchedOptionIndex = matchedOptionIndex === -1 ? this.findNextSelectedOptionIndex(index) : matchedOptionIndex;
            } else {
                matchedOptionIndex = this.findNextSelectedOptionIndex(index);
                matchedOptionIndex = matchedOptionIndex === -1 ? this.findPrevSelectedOptionIndex(index) : matchedOptionIndex;
            }
        }

        return matchedOptionIndex > -1 ? matchedOptionIndex : index;
    }

    equalityKey() {
        return this.optionValue ? null : this.dataKey;
    }

    isValidSelectedOption(option) {
        return this.isValidOption(option) && this.isSelected(option);
    }

    isOptionDisabled(option: any) {
        if (isFunction(this.optionDisabled)) {
            return this.optionDisabled(option);
        }
        return this.optionDisabled ? resolveFieldData(option, this.optionDisabled) : false;
    }

    isEquals(value1, value2) {
        return equals(value1, value2, this.equalityKey());
    }

    isSelected(option) {
        const optionValue = this.getOptionValue(option);

        if (this.multiple) return (this.modelValue() || []).some((value) => this.isEquals(value, optionValue));
        else return this.isEquals(this.modelValue(), optionValue);
    }

    isValidOption(option) {
        return option && !(this.isOptionDisabled(option) || this.isOptionGroup(option));
    }

    isEmpty() {
        return !this._options()?.length || !this.visibleOptions()?.length;
    }

    hasFilter() {
        return this._filterValue() && this._filterValue().trim().length > 0;
    }

    resetFilter() {
        if (this.filterViewChild && this.filterViewChild.nativeElement) {
            this.filterViewChild.nativeElement.value = '';
        }

        this._filterValue.set(null);
    }

    drop(event: CdkDragDrop<string[]>) {
        if (event) {
            this.onDrop.emit(event);
        }
    }

    /**
     * @override
     *
     * @see {@link BaseEditableHolder.writeControlValue}
     * Writes the value to the control.
     */
    writeControlValue(value: any, setModelValue: (value: any) => void): void {
        this.value = value;
        setModelValue(this.value);
        this.cd.markForCheck();
    }

    ngOnDestroy() {
        if (this.translationSubscription) {
            this.translationSubscription.unsubscribe();
        }

        super.ngOnDestroy();
    }
}

@NgModule({
    imports: [Listbox, SharedModule],
    exports: [Listbox, SharedModule]
})
export class ListboxModule {}
