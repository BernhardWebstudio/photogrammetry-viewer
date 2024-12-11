import {css, html, LitElement, nothing} from 'lit';
import {customElement, property} from 'lit/decorators.js';

import '@ui5/webcomponents/dist/Button';
import '@ui5/webcomponents/dist/Panel';
import '@ui5/webcomponents/dist/Label';
import '@ui5/webcomponents/dist/Title';
import '@ui5/webcomponents/dist/CheckBox';
import '@ui5/webcomponents/dist/List';
import '@ui5/webcomponents/dist/ListItemStandard';
import {MeasurementTool} from '../measurement-tool';

@customElement('measurement-tool')
export class MeasurementToolElement extends LitElement {
  @property({type: Boolean})
  isColumnMode: boolean = true;

  @property({type: Object})
  measurementTool!: MeasurementTool;
  precision = 4;

  render() {
    return html`
      <div
        id="layout"
        class="${this.isColumnMode ? 'ver-orientation' : 'hor-orientation'}"
      >
        <div class="row">
          <div class="alignCenter">
            <ui5-button @click="${this._handleNewPathClicked}" title="${this.measurementTool.numPoints > 0 ? 'Reset current measurement' : 'Start new measurement'}">
              ${this.measurementTool.numPoints > 0 ? 'Reset' : 'New'}
            </ui5-button>
          </div>
          <div class="alignCenter">
            <ui5-button
              ?disabled="${!this.measurementTool.isEditModeActive &&
              this.measurementTool.numPoints == 0}"
              @click="${this._handleUpdateEditStateClicked}"
              title="${this.measurementTool.isEditModeActive ? 'Pause current measurement' : 'Continue current measurement'}"
            >
              ${this.measurementTool.isEditModeActive ? 'Stop' : 'Continue'}
            </ui5-button>
          </div>
          <div class="alignCenter">
            <ui5-button
              ?disabled="${this.measurementTool.numPoints < 2}"
              @click="${() => { this.measurementTool.downloadPoints() }}"
              title="Download as CSV"
            >Download</ui5-button>
          </div>
        </div>
        <div>
          <ui5-checkbox text="Show distances" ?checked=${this.measurementTool.showMeasurementDistances} @change="${(ev: Event) => this.measurementTool.showMeasurementDistances = (ev.target as HTMLInputElement).checked}"></ui5-checkbox>
        </div>
        ${this.measurementTool.measurementPoints.length === 0 ? nothing : html `
        <table>
          <thead>
            <tr><th>#</th><th>x</th><th>y</th><th>z</th><th>distance</th><th>label</th></tr>
          </thead>
          <tbody>
          ${this.measurementTool.measurementPoints.map((point, index) => html`
            <tr>
              <td>${index}</td>
              <td>${point.positionInModelCoor.x.toFixed(this.precision)}</td>
              <td>${point.positionInModelCoor.y.toFixed(this.precision)}</td>
              <td>${point.positionInModelCoor.z.toFixed(this.precision)}</td>
              <td>${index > 0 ? this.measurementTool.measurementDistances[index - 1].distance.toFixed(this.precision) : ''}</td>
              <td><input .value="${point.label}" @change="${(ev: InputEvent) => { point.label = (ev.target as HTMLInputElement).value }}"></td>
            </tr>
          `)}
            <tr><td colspan="4"></td><td class="sum">${this.measurementTool.measuredLength.toFixed(5)}</td><td></td></tr>
          </tbody>
        </table>
        `}
      </div>
    `;
  }

  firstUpdated(): void {
    this.measurementTool.on('update-requested', () => this.requestUpdate());
    this.measurementTool.on('hotspot-added', () => this.requestUpdate());
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
  }

  private _handleNewPathClicked() {
    this.measurementTool.resetPoints();
    this.measurementTool.isEditModeActive = true;
    this.requestUpdate();
  }

  private _handleUpdateEditStateClicked() {
    this.measurementTool.isEditModeActive =
      !this.measurementTool.isEditModeActive;
    this.requestUpdate();
  }

  static styles = css`
    :host {
      min-width: 15em;
      height: 100%;
      width: 100%;
    }

    #layout.ver-orientation {
      flex-direction: column;
      width: 100%;
    }

    #layout.hor-orientation {
      flex-direction: row;
      height: 100%;
    }

    #layout {
      position: relative;
      min-width: 15em;
      display: flex;
      align-items: stretch;
      flex-direction: column;
      gap: 1rem;
    }

    .row {
      display: flex;
      flex: 1;
      flex-direction: row;
      gap: 1rem;
      justify-content: space-between;
      width: 100%;
    }

    .alignCenter {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    ui5-button {
      padding: 0.25rem;
    }

    ui5-label {
      --sapFontSize: 15;
    }

    td { padding: 1px 8px; text-align: right; }
    td.sum { position: relative; }
    td.sum:before { content: '\\03a3'; left: -10px; position: absolute; }
  `;
}
