import { SphericalPosition } from '@google/model-viewer/lib/features/controls';
import { Vector3D } from '@google/model-viewer/lib/model-viewer-base';

export interface Settings2DViewer {
  imageIdx: number;
  rotationAngle: number;
  imageAspectRatio: number;
}

export interface Settings3DViewer {
  orbitPos: SphericalPosition;
  cameraTarget: Vector3D;
  fovInRad: number;
}