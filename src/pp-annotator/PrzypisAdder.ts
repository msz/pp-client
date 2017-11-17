import * as _ from 'lodash';
import * as annotator from 'annotator';

const { ui, util } = annotator;
const { widget: { Widget } } = ui;

// annotator jquery for consistency
const { $ } = util;

/**
 * Adder shows and hides an annotation adder button that can be clicked on to
 * create an annotation.
 *
 * PrzypisAdder is for the most part a copy of annotator.Adder, except with two buttons, thus:
 * onCreate callback replaced with beginAnnotationCreate and beforeRequestCreate
 */

interface IPrzypisAdderOptions extends annotator.ui.widget.IWidgetOptions {
  beginAnnotationCreate?: (annotation: annotator.IAnnotation, e: JQuery.Event) => void;
  beforeRequestCreate?: (annotation: annotator.IAnnotation, e: JQuery.Event) => void;
}

export default class PrzypisAdder extends Widget {
  NS = 'przypis-adder';

  ignoreMouseup: boolean;
  annotation: annotator.IAnnotation | null;
  beginAnnotationCreate: IPrzypisAdderOptions["beginAnnotationCreate"];
  beforeRequestCreate: IPrzypisAdderOptions["beforeRequestCreate"];
  document: Document;

  static options: IPrzypisAdderOptions = {};

  constructor(options: IPrzypisAdderOptions) {
    super(options);

    this.ignoreMouseup = false;
    this.annotation = null;

    this.beginAnnotationCreate = PrzypisAdder.options.beginAnnotationCreate || options.beginAnnotationCreate;
    this.beforeRequestCreate = PrzypisAdder.options.beforeRequestCreate || options.beforeRequestCreate;

    const clickTag = this.getNSTag(`click.`);
    const mouseDownTag = this.getNSTag(`mousedown.`);
    const mouseUpTag = this.getNSTag(`mouseup.`);

    this.element
      .on(clickTag, 'button', this.onClick.bind(this))
      .on(mouseDownTag, 'button', this.onMouseDown.bind(this));

    this.document = this.element[0].ownerDocument;
    $(this.document.body).on(mouseUpTag, this.onMouseUp);
  }

  getNSTag(tag: string) {
    return `${tag}${this.NS}`;
  }

  destroy() {
    const offTag = this.getNSTag(`.`);

    this.element.off(offTag);
    $(this.document.body).off(offTag);

    super.destroy();
  }

  /**
   * Public: Load an annotation and show the adder.
   *
   * If the user clicks on the adder with an annotation loaded, the onCreate
   * handler will be called. In this way, the adder can serve as an
   * intermediary step between making a selection and creating an annotation.
   *
   * @param annotation an annotation Object to load.
   * @param position an Object specifying the position in which to show the editor (optional).
   */
  load(annotation: annotator.IAnnotation, position: annotator.util.IPosition) {
    this.annotation = annotation;
    this.show(position);
  }

  /**
   * Public: Show the adder.
   *
   * Examples
   *  adder.show()
   *  adder.hide()
   *  adder.show({top: '100px', left: '80px'})
   *
   * @param position an Object specifying the position in which to show the editor (optional).
   */
  show(position?: annotator.util.IPosition) {
    if (position) {
      this.element.css({
        top: position.top,
        left: position.left
      });
    }

    super.show();
  }

  /**
   * Event callback: called when the mouse button is pressed on the adder.
   *
   * @param event a mousedown Event object
   */
  onMouseDown(event: JQuery.Event) {
    // Do nothing for right-clicks, middle-clicks, etc.
    if (event.which > 1) {
      return;
    }

    event.preventDefault();

    // Prevent the selection code from firing when the mouse button is released
    this.ignoreMouseup = true;
  }

  /**
   * Event callback: called when the mouse button is released
   *
   * @param event a mouseup Event object
   */
  onMouseUp(event: JQuery.Event) {
    // Do nothing for right-clicks, middle-clicks, etc.
    if (event.which > 1) {
      return;
    }

    // Prevent the selection code from firing when the ignoreMouseup flag is set
    if (this.ignoreMouseup) {
      event.stopImmediatePropagation();
    }
  }


  /**
   * Event callback: called when the adder is clicked. The click event is used
   * as well as the mousedown so that we get the :active state on the adder
   * when clicked.
   *
   * event - A mousedown Event object
   *
   * Returns nothing.
   */
  onClick(event: JQuery.Event) {
    // Do nothing for right-clicks, middle-clicks, etc.
    if (event.which > 1) {
      return;
    }

    event.preventDefault();

    // Hide the adder
    this.hide();
    this.ignoreMouseup = false;

    if (this.annotation) {
      // create annotation button clicked
      if (event.target === this.element.find(".create-annotation")[0] && _.isFunction(this.beginAnnotationCreate)) {
        this.beginAnnotationCreate(this.annotation, event);
      }

      // create request button clicked
      if (event.target === this.element.find(".create-request")[0] && _.isFunction(this.beforeRequestCreate)) {
        this.beforeRequestCreate(this.annotation, event);
      }
    }
  }
}

/*
 Same case as described in PrzypisEditor
 */

// original annotator style removed (bare buttons)
// '<div class="annotator-adder annotator-hide">',
PrzypisAdder.template = `
<div class="annotator-hide">
  <button type="button" class="create-annotation">Dodaj przypis</button>
  <button type="button" class="create-request">Poproś o źródło</button>
</div>`;
