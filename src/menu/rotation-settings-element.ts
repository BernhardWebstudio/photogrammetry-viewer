import {LitElement, css, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';


import '@ui5/webcomponents/dist/Title';
import '@ui5/webcomponents/dist/Label';
import '@ui5/webcomponents/dist/StepInput.js';
import '@ui5/webcomponents/dist/CheckBox';

import {ImageRotationSettings, ModelOrientationSettings} from '../viewer-settings';

const clamp = (value: any, minValue: number, maxValue: number) => Math.min(Math.max(Number(value), minValue), maxValue);


@customElement('rotation-settings')
export class RotationSettingsElement extends LitElement {
  @property({type: Boolean})
  isColumnMode: boolean = false;

  @property({type: Boolean})
  isAutoRotationDisabled: boolean = false;

  @property({type: Object})
  imageRotationSettings!: ImageRotationSettings;

  @property({type: Object})
  modelOrientationSettings!: ModelOrientationSettings;

  private _userAutoRotationOn: boolean = false;


  render() {
    return html`
    <div id="layout" class="${this.isColumnMode ? 'ver-orientation' : 'hor-orientation'}">
      <div>    
        <ui5-title level="H5">3D</ui5-title>
        <div class = "input-row" >
          <ui5-label for="xOrientation" show-colon>X [&deg;]</ui5-label>
          <ui5-step-input id="xOrientation" value="0" min="0" max="359" step="10" @change="${this.handleXOrientationChanged}"></ui5-step-input>
        </div>
        <div class = "input-row" >
          <ui5-label for="yOrientation" show-colon>Y [&deg;]</ui5-label>
          <ui5-step-input id="yOrientation" value="0" min="0" max="359" step="10" @change="${this.handleYOrientationChanged}"></ui5-step-input>
        </div>
        <div class = "input-row" >
          <ui5-label for="zOrientation" show-colon>Z [&deg;]</ui5-label>
          <ui5-step-input id="zOrientation" value="0" min="0" max="359" step="10" @change="${this.handleZOrientationChanged}"></ui5-step-input>
        </div>
      </div>
      <div id="divider" class="${this.isColumnMode ? 'ver-orientation' : 'hor-orientation'}"></div>
      <div>    
        <ui5-title level="H5">2D</ui5-title>
        <div class = "input-row" >
          <ui5-label show-colon>Auto Rotation</ui5-label>
          <ui5-checkbox id= "autoRotationCheckbox" 
             text="${this.imageRotationSettings.isAutoRotationActivated ? 'On' : 'Off'}"
             ?checked="${this.imageRotationSettings.isAutoRotationActivated}" 
             ?disabled="${this.isAutoRotationDisabled}" 
             @change="${this._handleAutoRotationStateChanged}"></ui5-checkbox>
        </div>
        <div class = "input-row"  >
          <ui5-label for="imageAngle" show-colon>&phi; [&deg;]</ui5-label>
          <ui5-step-input id="imageAngle"
           value="${this.imageRotationSettings.isAutoRotationActivated ? this.imageRotationSettings.autoRotationAngle : this.imageRotationSettings.userSetRotationAngle}"
            min="-180" max="180" step="10" 
            ?disabled="${this.imageRotationSettings.isAutoRotationActivated}"
            @change="${this._handleRotationValueChanged}"></ui5-step-input>
        </div>
      </div>
    </div>
        `;
  }


  firstUpdated() {
    this.imageRotationSettings.on('rotation-angle-changed', () => this.requestUpdate());
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    if (!changedProperties.has('isAutoRotationDisabled')) {
      return;
    }

    if (this.isAutoRotationDisabled) {
      this._userAutoRotationOn = this.imageRotationSettings.isAutoRotationActivated;
      this.imageRotationSettings.isAutoRotationActivated = true;
    } else {
      if (this.imageRotationSettings.isAutoRotationActivated != this._userAutoRotationOn) {
        this.imageRotationSettings.isAutoRotationActivated = this._userAutoRotationOn;
      }
    }
  }

  private _handleRotationValueChanged(event: CustomEvent) {
    if (this.imageRotationSettings.isAutoRotationActivated) {
      return;
    }

    this.imageRotationSettings.userSetRotationAngle = event.detail.value;
  }

  private _handleAutoRotationStateChanged(event: Event) {
    const isAutoRotationActivated = (event.target as HTMLInputElement).checked;
    if (this.imageRotationSettings.isAutoRotationActivated == isAutoRotationActivated) {
      return;
    }

    this.imageRotationSettings.isAutoRotationActivated = isAutoRotationActivated;
  }


  private _handleDegreeInput(event: CustomEvent): number {
    return clamp(event.detail.value, 0, 359) * Math.PI / 180;
  }

  private handleXOrientationChanged(event: CustomEvent): void {
    this.modelOrientationSettings.xOrientationInRad = this._handleDegreeInput(event);
  }
  private handleYOrientationChanged(event: CustomEvent): void {
    this.modelOrientationSettings.yOrientationInRad = this._handleDegreeInput(event);
  }
  private handleZOrientationChanged(event: CustomEvent): void {
    this.modelOrientationSettings.zOrientationInRad= this._handleDegreeInput(event);
  }

  static styles = css`
        :host {
          height: 100%;
          width: 100%;
        }

        #divider.ver-orientation {
          border-top: 0.05rem solid darkgrey;
        }

        #divider.hor-orientation {
          border-left: 0.05rem solid darkgrey;
        }

        #layout.ver-orientation{
          flex-direction: column;
        }

        #layout.hor-orientation{
          flex-direction: row;
        }

        #layout{
          position: relative;
          display: flex;
          align-items: stretch;
          gap: 1rem;
        }

        .input-row{
          position: relative;
          display: flex;
          align-items: center;
          width: 11rem; 
          gap: 1rem;
        }
      `
}
