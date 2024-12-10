import {LitElement, css, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';

import '@ui5/webcomponents/dist/Icon.js';
import '@ui5/webcomponents/dist/ToggleButton.js';

import '@ui5/webcomponents/dist/Popover';


@customElement('pv-menu')
export class PVMenu extends LitElement {
  @property({type: Boolean})
  isColumnMode: boolean = false;

  render() {
    return html`
      <div
        id="toolBar"
        class="${this.isColumnMode ? 'ver-orientation' : 'hor-orientation'}"
      >
        <div
          id="btnBar"
          class="${this.isColumnMode ? 'hor-orientation' : 'ver-orientation'}"
        >
          <slot @slotchange=${this._handleSlotChange}></slot>
        </pv-tool-area>
      </div>
    `;
  }

  _handleSlotChange(e: CustomEvent) {
    console.log('Slot changed', e);
  }

  static styles = css`
    :host {
      max-height: 100%;
      max-width: 100%;
      --size: 13.5rem;
    }

    #btnBar.hor-orientation{
      width: 100%;
      flex-direction: row;
    }

    #btnBar.ver-orientation{
      height: 100%;
      flex-direction: column;
    }

    #btnBar
    {
      display: flex;
      gap: 0.25rem;
      pointer-events: auto;
    }

    #toolBar.hor-orientation{
      width: calc(100% - 1rem);
      height: var(--size);
      flex-direction: row;
    }

    #toolBar.ver-orientation{
      height: calc(100% - 1rem);
      width: var(--size);
      flex-direction: column;
    }

    #toolBar {
      display: flex;
      gap: 0.5625rem;
      left: 0.5rem;
      top: 0.5rem;
      position: absolute;
      pointer-events: none;
    }

    #toolBar.hor-orientation pv-tool-area{
      height: 100%;
    }

    #toolBar.ver-orientation pv-tool-area{
      width: 100%;
    }

    ui5-toggle-button{
      height: 2.5rem;
      width: 2.5rem;
    }

    ui5-toggle-button ui5-icon{
      height: 85%;
      width: 85%;
    }

    ui5-icon {
      stroke:black;
      fill: black;
      pointer-events: none;
      transform: translateY(2.5%)
    }
  `
}
