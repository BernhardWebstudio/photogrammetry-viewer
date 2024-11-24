import {LitElement, css, html} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';

import '@ui5/webcomponents/dist/Title';
import '@ui5/webcomponents/dist/Label';
import '@ui5/webcomponents/dist/Select';
import '@ui5/webcomponents/dist/Option';
import '@ui5/webcomponents/dist/CheckBox';
import '@ui5/webcomponents/dist/ColorPalette.js';
import '@ui5/webcomponents/dist/ColorPalettePopover.js';
import '@ui5/webcomponents/dist/features/ColorPaletteMoreColors.js';
import '@ui5/webcomponents/dist/StepInput.js';

import {EnvironmentSettings} from '../viewer-settings';
import ColorPalettePopover from '@ui5/webcomponents/dist/ColorPalettePopover.js';
import {Vector3} from 'three';

@customElement('environment-settings')
export class EnvironmentSettingsElement extends LitElement {
  @property({type: Boolean})
  isColumnMode: boolean = false;

  @property({type: Object})
  environmentSettings!: EnvironmentSettings;

  @query('#colorPalettePopover')
  colorPalettePopover!: ColorPalettePopover;

  @query('#color-palette-current')
  colorPaletteToggle!: HTMLElement;

  // TO DO: Brightness
  render() {
    return html`
      <div
        id="layout"
        class="${this.isColumnMode ? 'ver-orientation' : 'hor-orientation'}"
      >
        <div class="input-row">
          <ui5-label show-colon>Show Axes</ui5-label>
          <ui5-checkbox
            ?checked="${this.environmentSettings.showAxes}"
            @change="${this._handleShowAxesStateChanged}"
          ></ui5-checkbox>
        </div>
        <div class="input-row">
          <ui5-label show-colon>Remap 2D ⇔ 3D Axes</ui5-label>
          <ui5-select @change="${this._handleAxesRemapChanged}">
            <ui5-option selected>x-y-z</ui5-option>
            <ui5-option>x-z-y</ui5-option>
            <ui5-option>y-x-z</ui5-option>
            <ui5-option>y-z-x</ui5-option>
            <ui5-option>z-x-y</ui5-option>
            <ui5-option>z-y-x</ui5-option>
          </ui5-select>
        </div>
        <div
          id="divider"
          class="${this.isColumnMode ? 'ver-orientation' : 'hor-orientation'}"
        ></div>
        <div>
          <div class="input-row">
            <ui5-label show-colon for="color-palette-current"
              >Background Color</ui5-label
            >
            <ui5-color-palette-item
              value=${this.environmentSettings.backgroundColor[0]}
              @click=${this._toggleColorPalette}
              id="color-palette-current"
            ></ui5-color-palette-item>
          </div>
          <ui5-color-palette-popover
            id="colorPalettePopover"
            show-more-colors=""
            @item-click=${this._handleColorChanged}
          >
            <ui5-color-palette-item value="#444444"></ui5-color-palette-item>
            <ui5-color-palette-item value="lightpink"></ui5-color-palette-item>
            <ui5-color-palette-item
              value="rgb(216,124,172)"
            ></ui5-color-palette-item>
            <ui5-color-palette-item value="#6c666d"></ui5-color-palette-item>
            <ui5-color-palette-item
              value="rgb(55,81,95)"
            ></ui5-color-palette-item>
            <ui5-color-palette-item value="#0072bb"></ui5-color-palette-item>
            <ui5-color-palette-item value="powderblue"></ui5-color-palette-item>
            <ui5-color-palette-item
              value="rgb(143,201,58)"
            ></ui5-color-palette-item>
            <ui5-color-palette-item
              value="rgb(195,172,206)"
            ></ui5-color-palette-item>
            <ui5-color-palette-item value="orange"></ui5-color-palette-item>
          </ui5-color-palette-popover>
          <div class="input-row">
            <ui5-label show-colon>Gradient Effect</ui5-label>
            <ui5-checkbox
              ?checked="${this.environmentSettings.applyGradient}"
              @change="${this._handleApplyGradientStateChanged}"
            ></ui5-checkbox>
          </div>
        </div>
        <div
          id="divider"
          class="${this.isColumnMode ? 'ver-orientation' : 'hor-orientation'}"
        ></div>
        <div class="input-row">
          <ui5-label show-colon>Light [%]</ui5-label>
          <ui5-step-input
            value="100"
            min="0"
            max="500"
            step="10"
            @change="${this._handleBrightnessChanged}"
          ></ui5-step-input>
        </div>
      </div>
    `;
  }

  private _toggleColorPalette() {
    if (this.colorPalettePopover !== null) {
      if (typeof this.colorPalettePopover.opener == 'undefined') {
        this.colorPalettePopover.opener = this.colorPaletteToggle;
      }

      this.colorPalettePopover.open = !this.colorPalettePopover.open;
    }
  }

  private _handleColorChanged(event: CustomEvent) {
    this.environmentSettings.backgroundColor = event.detail.color;
    this.requestUpdate();
  }

  private _handleShowAxesStateChanged(event: CustomEvent) {
    this.environmentSettings.showAxes = (
      event.target as HTMLInputElement
    ).checked;
  }

  private _handleAxesRemapChanged(event: CustomEvent) {
    const xyz = 'xyz';
    const newAxesSplit = (event.target as HTMLSelectElement).value.split('-');
    console.log('Axes remap requested', newAxesSplit);
    if (newAxesSplit.length == 3) {
      const newAxes = newAxesSplit.map((axis) => xyz.indexOf(axis));
      this.environmentSettings.remapAxes = new Vector3(
          newAxes[0],
          newAxes[1],
          newAxes[2],
      );
    } else {
      console.warn('Unexpected input', newAxesSplit);
    }
  }

  private _handleApplyGradientStateChanged(event: CustomEvent) {
    this.environmentSettings.applyGradient = (
      event.target as HTMLInputElement
    ).checked;
  }

  private _handleBrightnessChanged(event: CustomEvent) {
    this.environmentSettings.brightness = event.detail.value / 100.0;
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

    #layout.ver-orientation {
      flex-direction: column;
    }

    #layout.hor-orientation {
      flex-direction: row;
    }

    #layout {
      position: relative;
      display: flex;
      align-items: stretch;
      gap: 0.5rem;
    }

    .input-row {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .ver-orientation > .input-row {
      width: 11rem;
    }
  `;
}
