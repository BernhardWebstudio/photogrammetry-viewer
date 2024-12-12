import {Vector3D} from '@google/model-viewer/lib/model-viewer-base';
import {BufferGeometry, Euler, Group, Line, LineDashedMaterial, Matrix3, Matrix4, Vector3, Vector4} from 'three';
import {EventEmitter} from 'events';
import {EulerYXZ} from './eulerYXZ';
import {Sensor} from './sensor';

export class MeasurementTool extends EventEmitter {
    private _isEditModeActive = false;

    private _measurementPoints: MeasurementPoint[] = [];
    private _measuredLength: number = 0;

    private _currentOrientation: Euler = new Euler();
    private _currentTranslation: Vector3 = new Vector3();

    private _imageSensor: Sensor | null = null;
    private _imageCamOrientation: Matrix4 = new Matrix4();

    private _measurementDistances: MeasurementDistance[] = [];
    private _showMeasurementDistances = true
    private _sceneElementGroup = new Group();

    set imageSensor(sensor: Sensor) {
      if (this._imageSensor && sensor.equals(this._imageSensor)) {
        return;
      }
      this._imageSensor = sensor;
    }

    set imageCamOrientation(imageCamOrientation: Matrix4) {
      if (this._imageCamOrientation.equals(imageCamOrientation)) {
        return;
      }

      this._imageCamOrientation = imageCamOrientation;
    }

    get sceneElementGroup(): Group {
      return this._sceneElementGroup;
    }

    set isEditModeActive(isEditModeActive: boolean) {
      if (this._isEditModeActive == isEditModeActive) {
        return;
      }
      this._isEditModeActive = isEditModeActive;
    }

    get isEditModeActive(): boolean {
      return this._isEditModeActive;
    }

    get numPoints(): number {
      return this._measurementPoints.length;
    }

    get measurementPoints(): MeasurementPoint[] {
      return this._measurementPoints
    }

    get measurementDistances() :MeasurementDistance[] {
      return this._measurementDistances
    }

    get measuredLength(): number {
      return this._measuredLength;
    }

    set translation(translation: Vector3) {
      if (translation.equals(this._currentTranslation)) {
        return;
      }

      this._measurementDistances.forEach((distance) => {
        distance.translate(translation);
      });

      this._currentTranslation = translation.clone();
    }

    set eulerOrientation(orientation: EulerYXZ) {
      if (this._currentOrientation.equals(orientation.angleInRad)) {
        return;
      }

      this._currentOrientation = orientation.angleInRad.clone();

      this._measurementDistances.forEach((distance) => {
        distance.changeSceneOrientation(this._currentOrientation);
      });

      this._measurementPoints.forEach((point) => {
        point.updatePosition(this._currentOrientation);
      });
    }

    addPointFromImage(imageXCoor: number, imageYCoor: number): void {
      if (this._imageSensor == null) {
        console.warn('Cannot add point from image, since image sensor is null.');
        return;
      }

      const pixelInCamCoor = new Vector3();
      pixelInCamCoor.x = imageXCoor - this._imageSensor.cx;
      pixelInCamCoor.y = imageYCoor - this._imageSensor.cy;
      pixelInCamCoor.z = this._imageSensor.focalLengthInPx;

      const rotationCamInWorld = new Matrix3();
      rotationCamInWorld.setFromMatrix4(this._imageCamOrientation);
      console.log('Cam orientation in World', this._imageCamOrientation);

      pixelInCamCoor.applyMatrix3(rotationCamInWorld);
      const direction = pixelInCamCoor.normalize();

      const camOrigin = new Vector3();
      camOrigin.setFromMatrixPosition(this._imageCamOrientation);

      this.emit('calculate-hotspot-requested', camOrigin, direction);
    }

    addPointFrom3DScene(position: Vector3D, normal: Vector3D, updateHotspotInImage: boolean = true): void {
      const currentIndex = this._measurementPoints.length;
      const positionAsThreeVector = new Vector3(position.x, position.y, position.z);
      const normalAsThreeVector = new Vector3(normal.x, normal.y, normal.z);
      const measurementPoint = new MeasurementPoint(currentIndex, positionAsThreeVector, normalAsThreeVector, this._currentOrientation);
      measurementPoint.on('hotspot-selected', this._updateHotspotInImage.bind(this));
      measurementPoint.on('hotspot-focus-changed', (hotspotIsInFocus: boolean) => this.emit('change-image-hotspot-visibility', hotspotIsInFocus));

      this._measurementPoints.push(measurementPoint);

      // distance to previous point
      if (currentIndex > 0) {
        const newMeasurementDistance = new MeasurementDistance(
            this._measurementDistances.length,
            this._measurementPoints[currentIndex - 1],
            measurementPoint,
            this._currentTranslation,
            this._currentOrientation,
        );
        if (!this._showMeasurementDistances) {
          newMeasurementDistance.hide()
        }
  
        this._measuredLength += newMeasurementDistance.distance;
        this._sceneElementGroup.add(newMeasurementDistance.sceneElement);
        this._measurementDistances.push(newMeasurementDistance);

        this.emit('hotspot-added', newMeasurementDistance.annotationElement);
        this.emit('update-requested');
      }

      this.emit('hotspot-added', measurementPoint.domElement);

      if (updateHotspotInImage) {
        this._updateHotspotInImage(measurementPoint.positionInSceneCoor);
      }
      window.setTimeout(() => measurementPoint.domElement.focus(), 0);
    }

    resetPoints() {
      this._measurementPoints.forEach((point) => {
        point.delete();
      });

      this._measurementPoints = [];
      this._measuredLength = 0;

      this._measurementDistances.forEach((distance) => {
        distance.reset();
      });

      this.emit('update-requested');
    }

    showPoints() {
      this._measurementPoints.forEach((point) => {
        point.show();
      });

      this._measurementDistances.forEach((distance) => {
        distance.show();
      });

      this.emit('scene-update-requested');
    }

    hidePoints() {
      this._measurementDistances.forEach((distance) => { // has to be set to hidden before the points
        distance.hide();
      });

      this._measurementPoints.forEach((point) => {
        point.hide();
      });

      this.emit('scene-update-requested');
    }

    get showMeasurementDistances() {
      return this._showMeasurementDistances
    }

    set showMeasurementDistances(value: boolean) {
      if (this._showMeasurementDistances != value) {
        this._showMeasurementDistances = value;
        this._measurementDistances.forEach((distance) => {
          if (value) {
            distance.show();
          } else {
            distance.hide();
          }
        });

        this.emit('scene-update-requested');
      }
    }

    downloadPoints() {
      let csv = `index,x,y,z${this.showMeasurementDistances ? ',distance' : ''},label\n`
      this._measurementPoints.forEach((point, index) => {
        const coords = point.positionInModelCoor
        csv += `${index},${coords.x},${coords.y},${coords.z}${this.showMeasurementDistances ? ',' + (index > 0 ? this._measurementDistances[index - 1].distance : '') : ''},"${point.label.replace(/"/g, '""')}"\n`
      })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
      link.download = 'measurement.csv'
      link.click()
    }

    private _updateHotspotInImage(hotspotPosition: Vector3) {
      if (this._imageSensor == null) {
        console.warn('Cannot update hotspot in image: image sensor null.');
        return;
      }

      const sensor = this._imageSensor;

      // 1. calculate image camera in scene coordinates
      const transformMat = this._imageCamOrientation.clone();
      const camPos = new Vector3().setFromMatrixPosition(transformMat);
      camPos.add(this._currentTranslation);
      transformMat.setPosition(camPos);
      transformMat.invert();

      const centeredHotspotPos = new Vector3().addVectors(hotspotPosition, this._currentTranslation);
      const posInHomogenWorldCoor = new Vector4(centeredHotspotPos.x, centeredHotspotPos.y, centeredHotspotPos.z, 1);
      const posInHomogenCameraCoor = posInHomogenWorldCoor.applyMatrix4(transformMat);

      const posInCameraCoor = new Vector3(posInHomogenCameraCoor.x/posInHomogenCameraCoor.w, posInHomogenCameraCoor.y/posInHomogenCameraCoor.w, posInHomogenCameraCoor.z/posInHomogenCameraCoor.w);
      const xImageCoor = posInCameraCoor.x/posInCameraCoor.z*sensor.focalLengthInPx+sensor.cx;
      const yImageCoor = posInCameraCoor.y/posInCameraCoor.z*sensor.focalLengthInPx+sensor.cy;

      if (xImageCoor > 0 && yImageCoor > 0) {
        this.emit('update-image-hotspot-position-requested', xImageCoor, yImageCoor);
      }
    }
}

export class MeasurementSceneLineElement {
    private _distanceLine: Line;
    private _lineGeometry: BufferGeometry = new BufferGeometry();
    private _lineMaterial: LineDashedMaterial;
    private _translation: Vector3 = new Vector3();
    private _pointsInModelCoor: Vector3[] = [];

    constructor() {
      this._lineMaterial = new LineDashedMaterial({
        color: 0xffffff,
        gapSize: 0.1,
        dashSize: 0.1,
      });
      this._lineMaterial.transparent = true;
      this._lineMaterial.depthTest = false;

      this._distanceLine = new Line(this._lineGeometry, this._lineMaterial);
    }

    get lineElement(): Line {
      return this._distanceLine;
    }

    addPoint(point: Vector3, translationInScene: Vector3, sceneOrientation: Euler) {
      const sceneToModelTransform = new Matrix4().makeRotationFromEuler(sceneOrientation).invert();
      const pointInModelCoor = point.clone().applyMatrix4(sceneToModelTransform);

      this._pointsInModelCoor.push(pointInModelCoor);
      this._lineGeometry.setFromPoints(this._pointsInModelCoor);

      this._lineGeometry.applyMatrix4(new Matrix4().makeRotationFromEuler(sceneOrientation));
      this._lineGeometry.translate(translationInScene.x, translationInScene.y, translationInScene.z);

      this._distanceLine.computeLineDistances();

      this._translation = translationInScene;
    }

    addPointInModelCoor(point: Vector3, translationInScene: Vector3, sceneOrientation: Euler) {
      this._pointsInModelCoor.push(point);
      this._lineGeometry.setFromPoints(this._pointsInModelCoor);

      this._lineGeometry.applyMatrix4(new Matrix4().makeRotationFromEuler(sceneOrientation));
      this._lineGeometry.translate(translationInScene.x, translationInScene.y, translationInScene.z);

      this._distanceLine.computeLineDistances();

      this._translation = translationInScene;
    }

    setTranslation(translation: Vector3) {
      this._lineGeometry.translate(
          -this._translation.x + translation.x,
          -this._translation.y + translation.y,
          -this._translation.z + translation.z);

      this._translation = translation;
    }

    setEulerOrientation(orientation: Euler) {
      this._lineGeometry.setFromPoints(this._pointsInModelCoor);
      this._lineGeometry.applyMatrix4(new Matrix4().makeRotationFromEuler(orientation));
      this._lineGeometry.translate(this._translation.x, this._translation.y, this._translation.z);
      this._distanceLine.computeLineDistances();
    }

    set opacity(value: number) {
      this._lineMaterial.opacity = value;
    }

    show() {
      this._distanceLine.visible = true;
    }
    hide() {
      this._distanceLine.visible = false;
    }
    reset() { // Remove if lines are separated
      this._pointsInModelCoor.length = 0;
      this._lineGeometry.setFromPoints(this._pointsInModelCoor);
      this._distanceLine.removeFromParent();
    }
}

export class MeasurementDistance {
    private _sceneLineElement: MeasurementSceneLineElement = new MeasurementSceneLineElement();
    private _distanceAnnotation: MeasurementDistanceAnnotation;
    private _numVisiblePoints: number = 0;
    private _isHidden: boolean = false;

    constructor(index: number, startPoint: MeasurementPoint, endPoint: MeasurementPoint, translationInScene: Vector3, sceneOrientation: Euler) {
      const distance = startPoint.distanceTo(endPoint);
      const annotationPosition = new Vector3().addVectors(startPoint.positionInSceneCoor, endPoint.positionInSceneCoor).multiplyScalar(0.5);
      const annotationNormal = new Vector3().addVectors(startPoint.normalInSceneCoor, endPoint.normalInSceneCoor).multiplyScalar(0.5); ;
      this._distanceAnnotation = new MeasurementDistanceAnnotation(index, distance, annotationPosition, annotationNormal, sceneOrientation);

      this._sceneLineElement.addPointInModelCoor(startPoint.positionInModelCoor, translationInScene, sceneOrientation);
      this._sceneLineElement.addPointInModelCoor(endPoint.positionInModelCoor, translationInScene, sceneOrientation);


      // MutationObserver erstellen
      const observer = new MutationObserver(this._handlePointVisibilityChanged.bind(this));
      observer.observe(startPoint.domElement, {attributes: true});
      observer.observe(endPoint.domElement, {attributes: true});

      this._numVisiblePoints = Number(startPoint.domElement.hasAttribute('data-visible')) + Number(endPoint.domElement.hasAttribute('data-visible'));
    }

    get distance(): number {
      return this._distanceAnnotation.distance;
    }

    get sceneElement(): Line {
      return this._sceneLineElement.lineElement;
    }

    get annotationElement(): HTMLButtonElement {
      return this._distanceAnnotation.domElement;
    }

    translate(translation: Vector3) {
      this._sceneLineElement.setTranslation(translation);
    }

    changeSceneOrientation(orientation: Euler) {
      this._sceneLineElement.setEulerOrientation(orientation);
      this._distanceAnnotation.updatePosition(orientation);
    }

    show() {
      this._sceneLineElement.show();
      this._distanceAnnotation.show();
      this._isHidden = false;
      this._updateAnnotationVisibility();
    }
    hide() {
      this._isHidden = true;
      this._distanceAnnotation.hide();
      this._sceneLineElement.hide();
    }
    reset() {
      this._sceneLineElement.reset();
      this._distanceAnnotation.delete();
    }

    private _handlePointVisibilityChanged(mutationsList: MutationRecord[]): void {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-visible') {
          const targetElement = mutation.target as HTMLElement;
          this._numVisiblePoints += targetElement.hasAttribute('data-visible') ? 1 : -1;
        }
      }

      if (!this._isHidden) {
        this._updateAnnotationVisibility();
      }
    }
    private _updateAnnotationVisibility() {
      if (this._numVisiblePoints <= 0) {
        this._distanceAnnotation.hide();
        this._sceneLineElement.opacity = 0.25;
      } else {
        this._distanceAnnotation.show();
        this._sceneLineElement.opacity = 1;
      }
    }
}

export class SceneHotspotElement extends EventEmitter {
    protected _domElement: HTMLButtonElement;

    private _positionInModelCoor: Vector3;
    private _positionInSceneCoor: Vector3;

    private _normalInModelCoor: Vector3;
    private _normalInSceneCoor: Vector3;

    constructor(positionInScene: Vector3, normalInScene: Vector3, sceneOrientation: Euler) {
      super();
      const sceneToModelTransform = new Matrix4().makeRotationFromEuler(sceneOrientation).invert();

      this._positionInSceneCoor = positionInScene;
      this._positionInModelCoor = this._positionInSceneCoor.clone().applyMatrix4(sceneToModelTransform);

      this._normalInSceneCoor = normalInScene;
      this._normalInModelCoor = this._normalInSceneCoor.clone().applyMatrix4(sceneToModelTransform);

      this._domElement = document.createElement('button');
      this._domElement.dataset.visibilityAttribute = 'visible';
      this._domElement.style.display = 'block';
      this._domElement.dataset.position = this.positionInSceneCoorAsString;
      this._domElement.dataset.normal = this.normalInSceneCoorAsString;

      this._domElement.addEventListener('focus', this._handleFocusChanged.bind(this));
      this._domElement.addEventListener('blur', this._handleFocusChanged.bind(this));
    }

    get domElement(): HTMLButtonElement {
      return this._domElement;
    }

    get positionInModelCoor(): Vector3 {
      return this._positionInModelCoor;
    }

    get positionInSceneCoor(): Vector3 {
      return this._positionInSceneCoor;
    }

    get normalInSceneCoor(): Vector3 {
      return this._normalInSceneCoor;
    }

    get positionInSceneCoorAsString(): string {
      return `${this._positionInSceneCoor.x}m ${this._positionInSceneCoor.y}m ${this._positionInSceneCoor.z}m`;
    }

    get normalInSceneCoorAsString(): string {
      return `${this._normalInSceneCoor.x}m ${this._normalInSceneCoor.y}m ${this._normalInSceneCoor.z}m`;
    }

    updatePosition(sceneOrientation: Euler) {
      this._positionInSceneCoor = this._positionInModelCoor.clone().applyEuler(sceneOrientation);
      this._normalInSceneCoor = this._normalInModelCoor.clone().applyEuler(sceneOrientation);

      this.domElement.dataset.position = this.positionInSceneCoorAsString;
      this.domElement.dataset.normal = this.normalInSceneCoorAsString;

      this.domElement.dispatchEvent(new Event('hotspot-position-changed'));
    }

    show() {
      this.domElement.style.display = 'block';
    }

    hide() {
      this.domElement.style.display = 'none';
    }
    delete() {
        this.domElement.parentNode?.removeChild(this.domElement);
    }

    private _handleFocusChanged(event: FocusEvent) {
      this.emit('hotspot-focus-changed', event.type=='focus');
    }
}

export class MeasurementPoint extends SceneHotspotElement {

  constructor(index: number, position: Vector3, normal: Vector3, sceneOrientation: Euler) {
    super(position, normal, sceneOrientation);

    this._domElement.slot = 'hotspot-measurementpoint' + index;
    this.domElement.classList.add('hotspot');
    this.domElement.textContent = index.toString();


    this.domElement.addEventListener('click', (event: Event) => {
      event.stopPropagation();
      this.emit('hotspot-selected', this.positionInSceneCoor);
    });
  }

  set label(value: string) {
    this.domElement.textContent = value
  }

  get label(): string {
    return this.domElement.textContent || ''
  }

  distanceTo(measurementPoint: MeasurementPoint): number {
    return this.positionInModelCoor.distanceTo(measurementPoint.positionInModelCoor);
  }
}

export class MeasurementDistanceAnnotation extends SceneHotspotElement {
    private _distance: number = 0;
    constructor(index: number, distance: number, position: Vector3, normal: Vector3, sceneOrientation: Euler) {
      super(position, normal, sceneOrientation);

      this._distance = distance;
      this._domElement.slot = 'hotspot-distance-annotation' + index;
      this.domElement.classList.add('annotation');
      this.domElement.textContent = distance.toFixed(1) + ' mm';
    }

    get distance(): number {
      return this._distance;
    }
}

