import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import '@ui5/webcomponents/dist/Button';
import '@ui5/webcomponents/dist/Panel';
import '@ui5/webcomponents/dist/Label';
import '@ui5/webcomponents/dist/Title';
import '@ui5/webcomponents/dist/List.js';
import '@ui5/webcomponents/dist/ListItemStandard.js';
import "@ui5/webcomponents/dist/BusyIndicator.js";
import { ViewerSettings } from '../viewer-settings';
import html2canvas from 'html2canvas';

@customElement('export-tool')
export class ExportToolElement extends LitElement {

  @property({ type: Object })
  viewerSettings!: ViewerSettings;

  @state()
  private _saving3D = false

  @state()
  private _saving2D = false

  download3D() {
    this._saving3D = true
    setTimeout(async() => {
      // get blob from 3D canvas
      const blob = await this.viewerSettings.viewer3DElement!.toBlob()
      // create image from blob
      const img = new Image()
      img.onload = async () => {
        // draw image into new canvas
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        canvas.getContext('2d')!.drawImage(img, 0, 0)
        // clear background since we will draw the 2D part of the viewer over the 3D part
        const previousBackground = this.viewerSettings.viewer3DElement!.style.background
        this.viewerSettings.viewer3DElement!.style.background = ''
        // render 2D part of the viewer into existing canvas
        await html2canvas(this.viewerSettings.viewer3DElement!, { canvas: canvas, backgroundColor: null })
        // restore background
        this.viewerSettings.viewer3DElement!.style.background = previousBackground
        // now create PNG data from canvas
        canvas.toBlob(blob => {
          if (blob) {
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = 'view-3d.png'
            link.click()
            this._saving3D = false
          }
        })
      }
      img.src = URL.createObjectURL(blob)
    }, 20)
  }

  download2D() {
    this._saving2D = true
    setTimeout(() => {
      (this.viewerSettings.viewer2DElement!.viewer!.drawer.canvas as HTMLCanvasElement).toBlob((blob) => {
        if (blob) {
          const link = document.createElement('a')
          link.href = window.URL.createObjectURL(blob)
          link.download = 'view-2d.png'
          link.click()
        }
        this._saving2D = false
        
      }, 'image/png')
    }, 20)
  }

  render() {
    return html`
        <div id="layout">
            <div class="row">
                <div class="alignCenter">
                    <ui5-button @click="${() => { this.download3D() }}" ?disabled="${this._saving3D}" title="Save 3D view">3D</ui5-button>
                </div>
                <div class="alignCenter">
                    <ui5-button @click="${() => { this.download2D() }}" ?disabled="${this._saving2D}" title="Save 2D view">2D</ui5-button>
                </div>
            </div>
            <ui5-busy-indicator ?active="${this._saving2D || this._saving3D}" delay="0"></ui5-busy-indicator>
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
