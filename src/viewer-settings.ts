import {EventEmitter} from 'events';
import {EulerYXZ} from './eulerYXZ';
import {MeasurementTool} from './measurement-tool';
import {ColorRGB, getRGBColor} from '@ui5/webcomponents-base/dist/util/ColorConversion.js';
import {Vector3} from 'three';


function convertColorRGBToString(color: ColorRGB): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

export interface ViewerSettings {
    imageRotation: ImageRotationSettings;
    modelOrientation: ModelOrientationSettings;
    measurementTool: MeasurementTool;
    environment3D: EnvironmentSettings;
}

export class ModelOrientationSettings extends EventEmitter {
    private _eulerOrientation: EulerYXZ = new EulerYXZ();

    set xOrientationInRad(angle: number) {
      if (this._eulerOrientation.x == angle) {
        return;
      }

      this._eulerOrientation.x = angle;
      this.emit('model-orientation-changed', this.eulerOrientationYXZInRad);
    }

    set yOrientationInRad(angle: number) {
      if (this._eulerOrientation.y == angle) {
        return;
      }

      this._eulerOrientation.y = angle;
      this.emit('model-orientation-changed', this.eulerOrientationYXZInRad);
    }


    set zOrientationInRad(angle: number) {
      if (this._eulerOrientation.z == angle) {
        return;
      }

      this._eulerOrientation.z = angle;
      this.emit('model-orientation-changed', this.eulerOrientationYXZInRad);
    }

    get eulerOrientationYXZInRad(): EulerYXZ {
      return this._eulerOrientation;
    }
}

export class ImageRotationSettings extends EventEmitter {
    private _autoRotationAngle: number = 0;
    private _userSetRotationAngle: number = 0;
    private _isAutoRotationActivated: boolean = false;

    // get + set     // get + set auto Rotation Angle
    set autoRotationAngle(angle: number) {
      if (this._autoRotationAngle == angle) {
        return;
      }
      this._autoRotationAngle = angle;

      if (this._isAutoRotationActivated) {
        this.emit('rotation-angle-changed', this._autoRotationAngle);
      }
    }
    get autoRotationAngle(): number {
      return this._autoRotationAngle;
    }

    // get + set _userSetRotationAngle
    set userSetRotationAngle(angle: number) {
      if (this._userSetRotationAngle == angle) {
        return;
      }
      this._userSetRotationAngle = angle;

      if (!this._isAutoRotationActivated) {
        this.emit('rotation-angle-changed', this._userSetRotationAngle);
      }
    }
    get userSetRotationAngle(): number {
      return this._userSetRotationAngle;
    }

    // get + set _isAutoRotationActivated
    set isAutoRotationActivated(isActivated: boolean) {
      if (this._isAutoRotationActivated == isActivated) {
        return;
      }
      this._isAutoRotationActivated = isActivated;

      if (this._isAutoRotationActivated) {
        this.emit('rotation-angle-changed', this._autoRotationAngle);
      } else {
        this.emit('rotation-angle-changed', this._userSetRotationAngle, false);
      }
    }
    get isAutoRotationActivated(): boolean {
      return this._isAutoRotationActivated;
    }
}

export class EnvironmentSettings extends EventEmitter {
    private _showAxes: boolean = true;
    private _remapAxes: Vector3 = new Vector3(0, 1, 2);

    private _backgroundColor: string = '#444444'
    private _gradientColor: string = '#b9b9b9'
    private _applyGradient: boolean = true;

    private _brightness: number = 1;

    set showAxes(showAxes: boolean) {
      if (this._showAxes == showAxes) {
        return;
      }
      this._showAxes = showAxes;
      this.emit('change-axes-visibility-requested', this._showAxes);
    }

    get showAxes(): boolean {
      return this._showAxes;
    }

    set remapAxes(newAxes: Vector3) {
      if (this._remapAxes == newAxes) {
        return;
      }
      console.log('Remapped axes to ', newAxes);
      this._remapAxes = newAxes;
      this.emit('change-axes-mapping-requested', this.remapAxes);
    }

    get remapAxes(): Vector3 {
      return this._remapAxes;
    }

    set backgroundColor(backgroundColor: string) {
      const colorInRGBFormat = getRGBColor(backgroundColor);
      const colorInHexFormat = convertColorRGBToString(colorInRGBFormat);
      console.log('Set backgroundcolor', colorInRGBFormat, colorInHexFormat);

      if (this._backgroundColor == colorInHexFormat) {
        return;
      }

      this._backgroundColor = colorInHexFormat;

      const gradientFactor = 2.5;
      const gradientColorInRGBFormat: ColorRGB = {
        r: Math.min(colorInRGBFormat.r * gradientFactor, 255),
        g: Math.min(colorInRGBFormat.g * gradientFactor, 255),
        b: Math.min(colorInRGBFormat.b * gradientFactor, 255),
      };

      this._gradientColor = convertColorRGBToString(gradientColorInRGBFormat);

      console.log('Set gradient color', gradientColorInRGBFormat, this._gradientColor);

      if (this._applyGradient) {
        this.emit('change-viewer-background-color-requested', this._backgroundColor, this._gradientColor);
      } else {
        this.emit('change-viewer-background-color-requested', this._backgroundColor, '');
      }
    }

    get backgroundColor(): [string, string] {
      if (this._applyGradient) {
        return [this._backgroundColor, this._gradientColor];
      } else {
        return [this._backgroundColor, ''];
      }
    }

    set applyGradient(applyGradient: boolean) {
      if (this._applyGradient == applyGradient) {
        return;
      }
      this._applyGradient = applyGradient;

      if (this._applyGradient) {
        this.emit('change-viewer-background-color-requested', this._backgroundColor, this._gradientColor);
      } else {
        this.emit('change-viewer-background-color-requested', this._backgroundColor, '');
      }
    }

    get applyGradient(): boolean {
      return this._applyGradient;
    }

    set brightness(brightness: number) {
      if (this._brightness == brightness) {
        return;
      }
      this._brightness = brightness;
      this.emit('change-exposure-requested', this._brightness);
    }
}

