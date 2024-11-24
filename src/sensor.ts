
export class Sensor {
    fovInRad: number;
    focalLengthInPx: number;

    cx: number;
    cy: number;

    aspectRatio: number;

    private _sensorWidthInPx: number;
    private _sensorHeightInPx: number;

    constructor(focalLengthInPx: number, sensorWidthInPx: number, sensorHeightInPx: number) {
      this.focalLengthInPx = focalLengthInPx;
      this._sensorWidthInPx = sensorWidthInPx;
      this._sensorHeightInPx = sensorHeightInPx;

      if (this._sensorHeightInPx == 0 || this._sensorWidthInPx == 0) {
        this.aspectRatio = -1;
      } else {
        this.aspectRatio = sensorWidthInPx / sensorHeightInPx;
      }

      this.fovInRad = this._sensorHeightInPx / this.focalLengthInPx; // model viewer is defines by vertical fov

      this.cx = 0.5 * (this._sensorWidthInPx - 1);
      this.cy = 0.5 * (this._sensorHeightInPx - 1);
    }

    equals(otherSensor: Sensor): boolean {
      if (otherSensor.focalLengthInPx == this.focalLengthInPx && otherSensor.cx == this.cx && otherSensor.cy == this.cy) {
        return true;
      } else {
        return false;
      }
    }
}
