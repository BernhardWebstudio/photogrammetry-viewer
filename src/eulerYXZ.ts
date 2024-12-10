import {Euler} from 'three';

export class EulerYXZ {
    angleInRad: Euler = new Euler(0, 0, 0, 'YXZ');

    angleInRadAsString(): string {
      return `${this.angleInRad.z}rad ${this.angleInRad.x}rad ${this.angleInRad.y}rad`; // model-viewer need this format
    }

    equals(otherEuler: EulerYXZ): boolean {
      if (otherEuler.angleInRadAsString() == this.angleInRadAsString()) {
        return true;
      } else {
        return false;
      }
    }
    set x(pitchInRad: number) {
      this.angleInRad.x = pitchInRad;
    }
    get x(): number {
      return this.angleInRad.x;
    }

    set y(yawInRad: number) {
      this.angleInRad.y = yawInRad;
    }
    get y(): number {
      return this.angleInRad.y;
    }

    set z(rollInRad: number) {
      this.angleInRad.z = rollInRad;
    }
    get z(): number {
      return this.angleInRad.x;
    }
}
