import { LitElement, css, html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js';

import "@ui5/webcomponents/dist/Icon.js";
import "@ui5/webcomponents/dist/ToggleButton.js";
import ToggleButton from '@ui5/webcomponents/dist/ToggleButton.js';

import { PVMenuItem } from './pv-menu-item'

import './pv-tool-area'
import { ToolAreaPopover } from './pv-tool-area'


@customElement('pv-menu')
export class PVMenu extends LitElement {

  @property({ type: Boolean })
  isColumnMode: boolean = false;

  @property()
  private currentTitle: string = "";

  @property({ type: Number })
  private _currentToolBarIndex: number = -1;

  @query('#toolArea')
  toolArea!: ToolAreaPopover; //  LitElement//HTMLElement;

  render() {
    return html`
            <div id="toolBar" class="${this.isColumnMode ? "ver-orientation" : "hor-orientation"}">
                <div id="btnBar" class="${this.isColumnMode ? "hor-orientation" : "ver-orientation"}">
                    ${this.tools.map((tool, idx) => html`
                        <ui5-toggle-button data-index = ${idx} @click="${this._handleToolBtnClicked}" ?pressed=${this._currentToolBarIndex == idx} tooltip=${tool.title}>
                            <ui5-icon name= ${tool.icon}></ui5-icon>
                        </ui5-toggle-button> `)}
                </div>
                <pv-tool-area id="toolArea" ?isColumnMode=${this.isColumnMode} title="${this.currentTitle}" @tool-area-closed="${this._handleToolAreaClosed}">
                    <slot  @slotchange = ${() => this.requestUpdate()}></slot>
                </pv-tool-area>
            </div>
        `
  }


  get tools(): PVMenuItem[] {
    const slot = this.shadowRoot?.querySelector('slot');
    const assignedElements = slot ? slot.assignedElements() : [];
    const menuItems = Array.from(assignedElements).filter(element => element instanceof PVMenuItem) as PVMenuItem[];
    return menuItems;
  }

  private _handleToolBtnClicked(event: PointerEvent) {
    const targetElement = event.target as ToggleButton;
    var targetIndex = targetElement.dataset.index;

    if (targetIndex === undefined) {
      return;
    }

    if (!targetElement.pressed) {
      this.toolArea.close();
      this._handleToolAreaClosed();
      return;
    }

    this._handleToolAreaClosed(); //close old tool area if visible

    this._currentToolBarIndex = Number(targetElement.dataset.index);

    if (this._currentToolBarIndex < 0 || this._currentToolBarIndex >= this.tools.length) {
      return;
    }

    let currentTool = this.tools[this._currentToolBarIndex]
    currentTool.isSelected = true;
    this.currentTitle = currentTool.title;

    const maxOffset = Math.max(targetElement.offsetLeft, targetElement.offsetTop);
    const length = Math.max(targetElement.offsetWidth, targetElement.offsetHeight);
    this.toolArea.show(maxOffset + 0.5 * length);

  }

  private _handleToolAreaClosed() {
    if (this._currentToolBarIndex > -1 && this._currentToolBarIndex < this.tools.length) {
      this.tools[this._currentToolBarIndex].isSelected = false;
    }
    this._currentToolBarIndex = -1;
    return;
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

    #toolBar{
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

    [pressed] ui5-icon {
      color:white;
      stroke:white;
      fill: white;
    }
  `
}
