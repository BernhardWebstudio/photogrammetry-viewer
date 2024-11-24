import Popover from '@ui5/webcomponents/dist/Popover.js';

import '@ui5/webcomponents/dist/Button';
import '@ui5/webcomponents/dist/Popover';

import {LitElement, css, html} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';

@customElement('pv-menu-item')
export class PVMenuItem extends LitElement {
  @property()
  title: string = '';

  @property()
  icon: string = '';

  @property()
  idx: number = 0;

  @query('#tool-popover')
  toolPopover!: Popover;

  @query('#tool-button')
  toolButton!: HTMLElement;

  render() {
    return html`
      <ui5-button
        data-index=${this.idx}
        tooltip=${this.title}
        id="tool-button"
        @click="${this._togglePopover}"
        icon=${this.icon}
      >
      </ui5-button>
      <ui5-popover id="tool-popover" header-text="${this.title}">
        <slot></slot>
      </ui5-popover>
    `;
  }

  _togglePopover() {
    if (this.toolPopover !== null) {
      if (typeof this.toolPopover.opener == 'undefined') {
        this.toolPopover.opener = this.toolButton;
      }

      this.toolPopover.open = !this.toolPopover.open;
    } else {
      console.warn('Popover not found.');
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
  }

  static styles = css`
    :host {
      max-height: 100%;
      max-width: 100%;
    }
  `;
}
