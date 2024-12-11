import {LitElement, css, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';

// import type {SegmentedButtonSelectionChangeEventDetail} from "@ui5/webcomponents";

import {unsafeSVG} from 'lit/directives/unsafe-svg.js';
import {registerIcon} from '@ui5/webcomponents-base/dist/asset-registries/Icons.js';
import {TemplateFunction} from '@ui5/webcomponents-base/dist/renderer/executeTemplate.js';
import doubleviewIcon from './assets/viewer_icon_doubleview.svg?raw';
import doubleviewMobileIcon from './assets/viewer_icon_doubleview_mobile.svg?raw';
import doubleviewSyncedIcon from './assets/viewer_icon_doubleview_synced.svg?raw';
import doubleviewSyncedMobileIcon from './assets/viewer_icon_doubleview_synced_mobile.svg?raw';
import singleViewIcon from './assets/viewer_icon_singleview.svg?raw';
import singleViewMobileIcon from './assets/viewer_icon_singleview_mobile.svg?raw';
import rotationIcon from './assets/rotation.svg?raw';
import measurementIcon from './assets/measuring_v3.svg?raw';
import environment3dIcon from './assets/3D_environment.svg?raw';

import {ViewerSettings} from './viewer-settings';

import '@ui5/webcomponents/dist/SegmentedButton.js';
import '@ui5/webcomponents/dist/Icon.js';
import '@ui5/webcomponents/dist/Button.js';

import '@ui5/webcomponents-icons/dist/decline';
import '@ui5/webcomponents-icons-tnt/dist/unit';
import '@ui5/webcomponents-icons/dist/measure';
import '@ui5/webcomponents-icons/dist/camera';
import '@ui5/webcomponents-icons/dist/chart-axis';
import '@ui5/webcomponents-icons/dist/rotate';

import './ui/pv-menu.ts';
import './ui/pv-menu-item.ts';

import './menu/environment-settings-element.ts';
import './menu/rotation-settings-element.ts';
import './menu/measurement-tool-element.ts';
import './menu/export-to-image-tool-element.ts';
import {
  ISegmentedButtonItem,
  SegmentedButtonSelectionChangeEventDetail,
} from '@ui5/webcomponents/dist/SegmentedButton.js';

const icons: Record<string, TemplateFunction> = {
  'doubleview': () => {
    return unsafeSVG(doubleviewIcon);
  },
  'doubleview-mobile': () => {
    return unsafeSVG(doubleviewMobileIcon);
  },
  'singleview': () => {
    return unsafeSVG(singleViewIcon);
  },
  'singleview-mobile': () => {
    return unsafeSVG(singleViewMobileIcon);
  },
  'doubleview-synced': () => {
    return unsafeSVG(doubleviewSyncedIcon);
  },
  'doubleview-synced-mobile': () => {
    return unsafeSVG(doubleviewSyncedMobileIcon);
  },
  'rotation': () => {
    return unsafeSVG(rotationIcon);
  },
  'measure': () => {
    return unsafeSVG(measurementIcon);
  },
  'environment3D': () => {
    return unsafeSVG(environment3dIcon);
  },
};

for (const icon in icons) {
  registerIcon(icon, {
    pathData: '',
    collection: 'custom',
    packageName: 'custom',
    viewBox: '0 0 284 284',
    customTemplate: icons[icon],
  });
}

@customElement('control-panel')
export class ControlPanel extends LitElement {
  @property({type: Number})
  currentViewModeIndex = 2;

  @property({type: Boolean})
  isColumnMode: boolean = false;

  @property({type: Object})
  viewerSettings!: ViewerSettings;

  render() {
    return html`
      <ui5-segmented-button
        id="viewModeBtn"
        class="${this.isColumnMode ? 'ver-orientation' : 'hor-orientation'}"
        @selection-change="${this._handleSelectionChanged}"
      >
        <ui5-segmented-button-item
          tooltip="One View Mode"
          ?selected=${this.currentViewModeIndex == 0}
        >
          <ui5-icon
            name="${this.isColumnMode ?
              'custom/singleview-mobile' :
              'custom/singleview'}"
            class="${this.isColumnMode ? 'rotated-icon' : ''}"
          ></ui5-icon>
        </ui5-segmented-button-item>
        <ui5-segmented-button-item
          tooltip="Sync Mode"
          ?selected=${this.currentViewModeIndex == 1}
        >
          <ui5-icon
            name="${this.isColumnMode ?
              'custom/doubleview-synced-mobile' :
              'custom/doubleview-synced'}"
            class="${this.isColumnMode ? 'rotated-icon' : ''}"
          ></ui5-icon>
        </ui5-segmented-button-item>
        <ui5-segmented-button-item
          tooltip="Navigation Mode"
          ?selected=${this.currentViewModeIndex == 2}
        >
          <ui5-icon
            name="${this.isColumnMode ?
              'custom/doubleview-mobile' :
              'custom/doubleview'}"
            class="${this.isColumnMode ? 'rotated-icon' : ''}"
          ></ui5-icon>
        </ui5-segmented-button-item>
      </ui5-segmented-button>

      <pv-menu ?isColumnMode=${this.isColumnMode}>
        <pv-menu-item
          icon="chart-axis"
          title="3D Environment"
          idx="1"
        >
          <environment-settings
            ?isColumnMode=${this.isColumnMode}
            .environmentSettings="${this.viewerSettings.environment3D}"
          >
          </environment-settings>
        </pv-menu-item>
        <pv-menu-item icon="rotate" title="Rotation Settings" idx="2">
          <rotation-settings
            ?isColumnMode=${this.isColumnMode}
            ?isAutoRotationDisabled="${this.currentViewModeIndex < 2}"
            .imageRotationSettings="${this.viewerSettings.imageRotation}"
            .modelOrientationSettings="${this.viewerSettings.modelOrientation}"
          >
          </rotation-settings>
        </pv-menu-item>
        <pv-menu-item icon="measure" title="Measurement Tool" idx="3">
          <measurement-tool
            ?isColumnMode=${this.isColumnMode}
            .measurementTool="${this.viewerSettings.measurementTool}"
          ></measurement-tool>
        </pv-menu-item>
        <pv-menu-item icon="camera" title="Save view as image" idx="4">
          <export-tool
            .viewerSettings="${this.viewerSettings}"
          ></export-tool>
        </pv-menu-item>
      </pv-menu>
    `;
  }

  private _handleSelectionChanged(
      event: CustomEvent<SegmentedButtonSelectionChangeEventDetail>,
  ) {
    const selectedItem: ISegmentedButtonItem = event.detail.selectedItems[0];
    const posInSet: string | null =
      selectedItem.getAttribute('pos-in-set') ?? selectedItem.ariaPosInSet;
    if (posInSet == null) {
      console.warn(
          'Selected item does not have an ariaPosInSet property. Check your segmented button implementation.',
          selectedItem,
      );
    }
    const selectedIndex: number =
      parseInt(posInSet == null ? '' : posInSet, 10) - 1;
    if (selectedIndex == this.currentViewModeIndex) {
      return;
    }

    this.currentViewModeIndex = selectedIndex;

    this.dispatchEvent(
        new CustomEvent('view-mode-changed', {
          detail: {
            viewIndex: selectedIndex,
          },
        }),
    );
  }

  static styles = css`
    :host {
      height: 100%;
      width: 100%;
      --_ui5_button_base_padding: 0px;
    }

    .rotated-icon {
      transform: rotate(-90deg);
    }

    .hor-orientation {
      left: 50%;
    }

    .ver-orientation {
      top: 50%;
    }

    #viewModeBtn.hor-orientation {
      bottom: 1%;
      transform: translateX(-50%);
    }

    #viewModeBtn.ver-orientation {
      right: 1%;
      transform-origin: 100% 0;
      transform: rotate(90deg) translateX(50%);
    }

    #viewModeBtn {
      position: absolute;
      pointer-events: auto;
    }

    ui5-segmented-button-item {
      height: 3.5rem;
      padding: 1px 1px 1px 1px;
    }

    ui5-icon {
      width: 3.5rem;
      height: 3.5rem;
      stroke: black;
      fill: black;
      pointer-events: none;
      transform: translateY(2.5%);
    }
  `;
}
