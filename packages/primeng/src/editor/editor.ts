import { CommonModule, isPlatformServer } from '@angular/common';
import { AfterContentInit, afterNextRender, ChangeDetectionStrategy, Component, ContentChild, ContentChildren, EventEmitter, forwardRef, inject, Input, NgModule, Output, QueryList, TemplateRef, ViewEncapsulation } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { findSingle } from '@primeuix/utils';
import { Header, PrimeTemplate, SharedModule } from 'primeng/api';
import { BaseEditableHolder } from 'primeng/baseeditableholder';
import { Nullable } from 'primeng/ts-helpers';
import { EditorInitEvent, EditorSelectionChangeEvent, EditorTextChangeEvent } from './editor.interface';
import { EditorStyle } from './style/editorstyle';

export const EDITOR_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => Editor),
    multi: true
};
/**
 * Editor groups a collection of contents in tabs.
 * @group Components
 */
@Component({
    selector: 'p-editor',
    standalone: true,
    imports: [CommonModule, SharedModule],
    template: `
        <div [class]="cx('toolbar')" *ngIf="toolbar || headerTemplate || _headerTemplate">
            <ng-content select="p-header"></ng-content>
            <ng-container *ngTemplateOutlet="headerTemplate || _headerTemplate"></ng-container>
        </div>
        <div [class]="cx('toolbar')" *ngIf="!toolbar && !headerTemplate && !_headerTemplate">
            <span class="ql-formats">
                <select class="ql-header">
                    <option value="1">Heading</option>
                    <option value="2">Subheading</option>
                    <option selected>Normal</option>
                </select>
                <select class="ql-font">
                    <option selected>Sans Serif</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Monospace</option>
                </select>
            </span>
            <span class="ql-formats">
                <button class="ql-bold" aria-label="Bold" type="button"></button>
                <button class="ql-italic" aria-label="Italic" type="button"></button>
                <button class="ql-underline" aria-label="Underline" type="button"></button>
            </span>
            <span class="ql-formats">
                <select class="ql-color"></select>
                <select class="ql-background"></select>
            </span>
            <span class="ql-formats">
                <button class="ql-list" value="ordered" aria-label="Ordered List" type="button"></button>
                <button class="ql-list" value="bullet" aria-label="Unordered List" type="button"></button>
                <select class="ql-align">
                    <option selected></option>
                    <option value="center">center</option>
                    <option value="right">right</option>
                    <option value="justify">justify</option>
                </select>
            </span>
            <span class="ql-formats">
                <button class="ql-link" aria-label="Insert Link" type="button"></button>
                <button class="ql-image" aria-label="Insert Image" type="button"></button>
                <button class="ql-code-block" aria-label="Insert Code Block" type="button"></button>
            </span>
            <span class="ql-formats">
                <button class="ql-clean" aria-label="Remove Styles" type="button"></button>
            </span>
        </div>
        <div [class]="cx('content')" [ngStyle]="style"></div>
    `,
    providers: [EDITOR_VALUE_ACCESSOR, EditorStyle],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    host: {
        '[class]': "cn(cx('root'), styleClass)"
    }
})
export class Editor extends BaseEditableHolder implements AfterContentInit {
    /**
     * Inline style of the container.
     * @group Props
     */
    @Input() style: { [klass: string]: any } | null | undefined;
    /**
     * Style class of the container.
     * @deprecated since v20.0.0, use `class` instead.
     * @group Props
     */
    @Input() styleClass: string | undefined;
    /**
     * Placeholder text to show when editor is empty.
     * @group Props
     */
    @Input() placeholder: string | undefined;
    /**
     * Whitelist of formats to display, see [here](https://quilljs.com/docs/formats/) for available options.
     * @group Props
     */
    @Input() formats: string[] | undefined;
    /**
     * Modules configuration of Editor, see [here](https://quilljs.com/docs/modules/) for available options.
     * @group Props
     */
    @Input() modules: object | undefined;
    /**
     * DOM Element or a CSS selector for a DOM Element, within which the editor’s p elements (i.e. tooltips, etc.) should be confined. Currently, it only considers left and right boundaries.
     * @group Props
     */
    @Input() bounds: HTMLElement | string | undefined;
    /**
     * DOM Element or a CSS selector for a DOM Element, specifying which container has the scrollbars (i.e. overflow-y: auto), if is has been changed from the default ql-editor with custom CSS. Necessary to fix scroll jumping bugs when Quill is set to auto grow its height, and another ancestor container is responsible from the scrolling..
     * @group Props
     */
    @Input() scrollingContainer: HTMLElement | string | undefined;
    /**
     * Shortcut for debug. Note debug is a static method and will affect other instances of Quill editors on the page. Only warning and error messages are enabled by default.
     * @group Props
     */
    @Input() debug: string | undefined;
    /**
     * Whether to instantiate the editor to read-only mode.
     * @group Props
     */
    @Input() get readonly(): boolean {
        return this._readonly;
    }
    set readonly(val: boolean) {
        this._readonly = val;

        if (this.quill) {
            if (this._readonly) this.quill.disable();
            else this.quill.enable();
        }
    }
    /**
     * Callback to invoke when the quill modules are loaded.
     * @param {EditorInitEvent} event - custom event.
     * @group Emits
     */
    @Output() onInit: EventEmitter<EditorInitEvent> = new EventEmitter<EditorInitEvent>();
    /**
     * Callback to invoke when text of editor changes.
     * @param {EditorTextChangeEvent} event - custom event.
     * @group Emits
     */
    @Output() onTextChange: EventEmitter<EditorTextChangeEvent> = new EventEmitter<EditorTextChangeEvent>();
    /**
     * Callback to invoke when selection of the text changes.
     * @param {EditorSelectionChangeEvent} event - custom event.
     * @group Emits
     */
    @Output() onSelectionChange: EventEmitter<EditorSelectionChangeEvent> = new EventEmitter<EditorSelectionChangeEvent>();

    @ContentChild(Header) toolbar: any;

    value: Nullable<string>;

    delayedCommand: Function | null = null;

    _readonly: boolean = false;

    quill: any;

    dynamicQuill: any;

    /**
     * Custom item template.
     * @group Templates
     */
    @ContentChild('header', { descendants: false }) headerTemplate: Nullable<TemplateRef<any>>;

    @ContentChildren(PrimeTemplate) templates!: QueryList<PrimeTemplate>;

    _headerTemplate: TemplateRef<any> | undefined;

    private get isAttachedQuillEditorToDOM(): boolean | undefined {
        return this.quillElements?.editorElement?.isConnected;
    }

    private quillElements!: { editorElement: HTMLElement; toolbarElement: HTMLElement };

    _componentStyle = inject(EditorStyle);

    constructor() {
        super();
        /**
         * Read or write the DOM once, when initializing non-Angular (Quill) library.
         */
        afterNextRender(() => {
            this.initQuillElements();
            this.initQuillEditor();
        });
    }

    ngAfterContentInit() {
        this.templates.forEach((item) => {
            switch (item.getType()) {
                case 'header':
                    this.headerTemplate = item.template;
                    break;
            }
        });
    }

    /**
     * @override
     *
     * @see {@link BaseEditableHolder.writeControlValue}
     * Writes the value to the control.
     */
    writeControlValue(value: any): void {
        this.value = value;

        if (this.quill) {
            if (value) {
                const command = (): void => {
                    this.quill.setContents(this.quill.clipboard.convert(this.dynamicQuill.version.startsWith('2') ? { html: this.value } : this.value));
                };

                if (this.isAttachedQuillEditorToDOM) {
                    command();
                } else {
                    this.delayedCommand = command;
                }
            } else {
                const command = (): void => {
                    this.quill.setText('');
                };

                if (this.isAttachedQuillEditorToDOM) {
                    command();
                } else {
                    this.delayedCommand = command;
                }
            }
        }
    }

    getQuill() {
        return this.quill;
    }

    private initQuillEditor(): void {
        if (isPlatformServer(this.platformId)) {
            return;
        }

        /**
         * Importing Quill at top level, throws `document is undefined` error during when
         * building for SSR, so this dynamically loads quill when it's in browser module.
         */
        if (!this.dynamicQuill) {
            import('quill')
                .then((quillModule: any) => {
                    this.dynamicQuill = quillModule.default;
                    this.createQuillEditor();
                })
                .catch((e) => console.error(e.message));
        } else {
            this.createQuillEditor();
        }
    }

    private createQuillEditor(): void {
        this.initQuillElements();

        const { toolbarElement, editorElement } = this.quillElements;
        let defaultModule = { toolbar: toolbarElement };
        let modules = this.modules ? { ...defaultModule, ...this.modules } : defaultModule;
        this.quill = new this.dynamicQuill(editorElement, {
            modules: modules,
            placeholder: this.placeholder,
            readOnly: this.readonly,
            theme: 'snow',
            formats: this.formats,
            bounds: this.bounds,
            debug: this.debug,
            scrollingContainer: this.scrollingContainer
        });

        const isQuill2 = this.dynamicQuill.version.startsWith('2');

        if (this.value) {
            this.quill.setContents(this.quill.clipboard.convert(isQuill2 ? { html: this.value } : this.value));
        }

        this.quill.on('text-change', (delta: any, oldContents: any, source: any) => {
            if (source === 'user') {
                let html = isQuill2 ? this.quill.getSemanticHTML() : findSingle(editorElement, '.ql-editor').innerHTML;
                let text = this.quill.getText().trim();
                if (html === '<p><br></p>') {
                    html = null;
                }

                this.onTextChange.emit({
                    htmlValue: html,
                    textValue: text,
                    delta: delta,
                    source: source
                });

                this.onModelChange(html);
                this.onModelTouched();
            }
        });

        this.quill.on('selection-change', (range: string, oldRange: string, source: string) => {
            this.onSelectionChange.emit({
                range: range,
                oldRange: oldRange,
                source: source
            });
        });

        this.onInit.emit({
            editor: this.quill
        });
    }

    private initQuillElements(): void {
        if (!this.quillElements) {
            this.quillElements = {
                editorElement: findSingle(this.el.nativeElement, 'div.p-editor-content'),
                toolbarElement: findSingle(this.el.nativeElement, 'div.p-editor-toolbar')
            } as any;
        }
    }
}

@NgModule({
    imports: [Editor, SharedModule],
    exports: [Editor, SharedModule]
})
export class EditorModule {}
