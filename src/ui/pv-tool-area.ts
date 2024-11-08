import { LitElement, css, html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js';

import "@ui5/webcomponents/dist/Card";
import "@ui5/webcomponents/dist/CardHeader";

import "@ui5/webcomponents/dist/Title"
import "@ui5/webcomponents/dist/Button"
import "@ui5/webcomponents/dist/Bar.js";
import "@ui5/webcomponents-icons/dist/decline";

import "@ui5/webcomponents/dist/Dialog";


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
        	<span id="arrow" class="${this.isColumnMode ? "show-up" : "show-left"}" ></span>
            <ui5-dialog id="dialog">
                <ui5-bar slot="header" design="Header"> 
                    <ui5-title level="H6" slot="startContent">
                        ${this.title}
                    </ui5-title>
                    <ui5-button
                        @click="${this._handleExitClicked}" 
                        design="Transparent"
                        id="closeDialogButton"
                        slot="endContent"
                        icon="decline"
                    ></ui5-button>
                </ui5-bar>
                <slot id="content" class="${this.isColumnMode ? "ver-orientation" : "hor-orientation"}" ></slot>
            </ui5-dialog>

           
        `
    } 

    close() {
        this.style.display = "none"; 
    }

    show(arrowOffset: number) {
        this.style.display = "flex";
        this.style.setProperty('--arrowOffset', arrowOffset + 'px');
    }

    private _handleExitClicked() {
        this.style.display = "none";
        this.dispatchEvent(new Event('tool-area-closed'));
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

    #arrow{
        pointer-events: none;
        display: block;
        width: 1rem;
        height: 1rem;
        position: absolute;
        overflow: hidden;
    }

    #arrow:after {
        content: "";
        display: block;
        width: 0.7rem;
        height: 0.7rem;
        background-color: var(--sapGroup_ContentBackground);
        box-shadow: var(--sapContent_Shadow3);
        transform: rotate(-45deg);
    }

    #arrow.show-up{
        height: 0.5625rem;
        top: -0.5rem;
        left: -0.5625rem;
        transform: translate(var(--arrowOffset), 0px);
    }
    #arrow.show-up:after{
        margin: var(--_ui5_popover_upward_arrow_margin);
    }

    #arrow.show-left{
        left: -0.5625rem;
        top: -0.5625rem;
        width: 0.5625rem;
        height: 1rem;
        transform: translate(0px,var(--arrowOffset));
    }

    #arrow.show-left:after {
        margin: var(--_ui5_popover_left_arrow_margin);
    }
  `
}

