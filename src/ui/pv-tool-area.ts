import { LitElement, css, html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js';

import "@ui5/webcomponents/dist/Card";
import "@ui5/webcomponents/dist/CardHeader";

import "@ui5/webcomponents/dist/Title"
import "@ui5/webcomponents/dist/Button"
import "@ui5/webcomponents/dist/Bar.js";
import "@ui5/webcomponents-icons/dist/decline";

import "@ui5/webcomponents/dist/Popover";

@customElement('pv-tool-area')
export class ToolAreaPopover extends LitElement {

    @property({ type: Boolean })
    isColumnMode: boolean = false;

    @property()
    title: string = "";

    @query('#arrow')
    arrowElement!: HTMLElement; 

    render() {
        return html`
            <ui5-popover id="dialog" header-text="${this.title}">
                <slot id="content" class="${this.isColumnMode ? "ver-orientation" : "hor-orientation"}" ></slot>
            </ui5-popover>
        `
    } 

    close() {
        this.style.display = "none"; 
    }

    show(arrowOffset: number) {
        this.style.display = "flex";
        this.style.setProperty('--arrowOffset', arrowOffset + 'px');
    }

    static styles = css`
    :host {
      max-height: 100%;
      max-width: 100%;
      display:none;
      position: relative;
      pointer-events: auto;
      --arrowOffset: 0;
      --_ui5_popup_content_padding_s: 1rem;
      --_ui5_popup_content_padding_m_l: 1rem;
      --_ui5_popup_content_padding_xl: 1rem;
      --_ui5_popup_header_footer_padding_s: 0rem;
      --_ui5_popup_header_footer_padding_m_l: 0rem;
      --_ui5_popup_header_footer_padding_xl: 0rem;
    }

    ui5-title{
        font-family: var(--sapFontBoldFamily);
        width: 100%;
    }

    ui5-dialog{
        display: flex;
        position: static;
        width: 100%;
        max-width: 100%;
        max-height: 100%;
        min-width: 0px;
    }

    #content.ver-orientation{
        width: 100%;
    }
    #content.hor-orientation{
        height: 100%;
    }
  `
}

