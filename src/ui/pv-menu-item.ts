

import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js';


@customElement('pv-menu-item')
export class PVMenuItem extends LitElement {

  @property()
  title: string = "";

  @property()
  icon: string = "";

  @property({ type: Boolean, reflect: true })
  isSelected: boolean = false;

  
  render() {
    return html`
        	<slot></slot>
        `
  }


  updated(changedProperties: Map<string, unknown>) {

    super.updated(changedProperties)

    if (changedProperties.has("isSelected")) {
      this.hidden = !this.isSelected;
    }
  }

  static styles = css`
  :host {
    max-height: 100%;
    max-width: 100%;
  }
`
}
