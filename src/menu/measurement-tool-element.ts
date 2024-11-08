import {css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js';

import "@ui5/webcomponents/dist/Button";
import "@ui5/webcomponents/dist/Panel";
import "@ui5/webcomponents/dist/Label";
import "@ui5/webcomponents/dist/Title";
import "@ui5/webcomponents/dist/List.js";
import "@ui5/webcomponents/dist/ListItemStandard.js"
import { PVMenuItem } from '../ui/pv-menu-item';
import { MeasurementTool } from '../measurement-tool';

@customElement('measurement-tool')
export class MeasurementToolElement extends PVMenuItem {

  @property({ type: Boolean })
  isColumnMode: boolean = false;

  @property({ type: Object })
  measurementTool!: MeasurementTool;

  render() {
    return html`
      <div id="layout" class="${this.isColumnMode ? "ver-orientation" : "hor-orientation"}">
        <div class="alignCenter ${this.isColumnMode ? "ver-orientation" : "hor-orientation"}" >
            <ui5-button 
              @click="${this._handleNewPathClicked}" >New</ui5-button>
        </div>
        <div class="alignCenter ${this.isColumnMode ? "ver-orientation" : "hor-orientation"}" >
          <ui5-label level="H1">&Sigma;:</ui5-label>
          <ui5-label>${this.measurementTool.measuredLength.toFixed(1)}</ui5-label> 
          <ui5-label> mm</ui5-label>
        </div>
        <div class="alignCenter ${this.isColumnMode ? "ver-orientation" : "hor-orientation"}" >
            <ui5-button 
              ?disabled="${!this.measurementTool.isEditModeActive && this.measurementTool.numPoints == 0}"
               @click="${this._handleUpdateEditStateClicked}" >${this.measurementTool.isEditModeActive ? "Stop" : "Continue"}</ui5-button>
        </div>
      </div>
        `
  }

  firstUpdated(): void {
    this.measurementTool.on("update-requested", () => this.requestUpdate() );
  }

  updated(changedProperties: Map<string, unknown>) {

    super.updated(changedProperties)

    if (changedProperties.has("isSelected")) {
      this.measurementTool.isActive = this.isSelected;
    }
  }

  private _handleNewPathClicked() {
    this.measurementTool.resetPoints();
    this.measurementTool.isEditModeActive = true;
    this.requestUpdate();
  }

  private _handleUpdateEditStateClicked() {
    this.measurementTool.isEditModeActive = !this.measurementTool.isEditModeActive;
    this.requestUpdate();
  }


  static styles = css`
    :host {
      height: 100%;
      width: 100%;
    }

    #layout.ver-orientation{
      flex-direction: column;
      width: 100%;
    }

    #layout.hor-orientation{
      flex-direction: row;
      height: 100%;
    }

    #layout{
      position: relative;
      display: flex;
      align-items: stretch;
      gap: 1rem;
    }

    
    .alignCenter.ver-orientation{
      width: 100%;
      justify-content: center;
    }

    .alignCenter.hor-orientation{
      height: 100%;
      align-items: center;
    }

    .alignCenter
    {
      display: flex;
    }

    ui5-button{
      padding: 0.25rem;
    }

    ui5-label{
      --sapFontSize: 15;
    }

  `
}

