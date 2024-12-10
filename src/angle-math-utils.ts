export function radToDeg(rad: number): number {
  return rad * (180 / Math.PI);
}

export function degToRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function normalizeDeg(angle: number): number {
  while (angle < -180) angle += 360;
  while (angle > 180) angle -= 360;
  return angle;
}
