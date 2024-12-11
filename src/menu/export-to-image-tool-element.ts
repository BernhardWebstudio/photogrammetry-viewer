import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import '@ui5/webcomponents/dist/Button';
import '@ui5/webcomponents/dist/Panel';
import '@ui5/webcomponents/dist/Label';
import '@ui5/webcomponents/dist/Title';
import '@ui5/webcomponents/dist/List.js';
import '@ui5/webcomponents/dist/ListItemStandard.js';
import { ViewerSettings } from '../viewer-settings';

@customElement('export-tool')
export class ExportToolElement extends LitElement {

  @property({ type: Object })
  viewerSettings!: ViewerSettings;

  download3D() {
    // hide measurements
    const previsousState = this.viewerSettings.measurementTool.showMeasurementDistances
    this.viewerSettings.measurementTool.showMeasurementDistances = false
    setTimeout(async () => {
      if (this.viewerSettings.viewer3DElement) {
        const blob = await this.viewerSettings.viewer3DElement.toBlob()
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        link.download = 'view-3d.png'
        link.click()
      }
      this.viewerSettings.measurementTool.showMeasurementDistances = previsousState
    }, 100)
  }

  async download2D() {
    if (this.viewerSettings.viewer2DElement?.viewer && this.viewerSettings.viewer2DElement.viewer.drawer.canvas instanceof HTMLCanvasElement) {
      this.viewerSettings.viewer2DElement.viewer.drawer.canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement('a')
          link.href = window.URL.createObjectURL(blob)
          link.download = 'view-2d.png'
          link.click()
        }
      }, 'image/png')
    }
  }

  render() {
    return html`
        <div id="layout">
            <div class="row">
                <div class="alignCenter">
                    <ui5-button @click="${() => { this.download3D() }}" title="Save 3D view">3D</ui5-button>
                </div>
                <div class="alignCenter">
                    <ui5-button @click="${() => { this.download2D() }}" title="Save 2D view">2D</ui5-button>
                </div>
            </div>
        </div>
    `
  }

  static styles = css`
    :host {
      min-width: 15em;
      height: 100%;
      width: 100%;
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
  `;
}
