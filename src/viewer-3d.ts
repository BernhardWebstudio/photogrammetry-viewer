import '@google/model-viewer';
import { ModelViewerElement } from '@google/model-viewer';
import { customElement, property } from 'lit/decorators.js';
import { Camera, AxesHelper, Vector3, Raycaster, Matrix3 } from 'three'
import { SingleClickEventHandler, debounce } from './helper';

import { css } from 'lit'

import { $scene } from '@google/model-viewer/lib/model-viewer-base';
import { $controls, SphericalPosition } from '@google/model-viewer/lib/features/controls';
import { ChangeSource } from '@google/model-viewer/lib/three-components/SmoothControls';
import { ViewerSettings } from './viewer-settings'
import { EulerYXZ } from './eulerYXZ';
import { MeasurementTool } from './measurement-tool';

@customElement('viewer-3d')
export class ViewerElement3D extends ModelViewerElement {

    private _axesHelper: AxesHelper = new AxesHelper();

    private _lastSphericalPosition: SphericalPosition = { theta: -1, phi: -1, radius: -1 };
    private _lastFieldOfViewInDeg: number = -1;

    private _referenceFieldOfViewInRad: number = -1;
    private _referenceMaxRadius: number = -1;
    private _isRadiusConst: boolean = false;
    private _maxZoomLevel: number = 100; //default value //identical to image zoom
    private _minZoomLevel: number = 0.5; //default value 
    private _currentZoomLevel: number = 1.0;

    private _deltaX: number = 0;
    private _deltaY: number = 0;

    @property({ type: Object })
    measurementTool!: MeasurementTool;

    constructor() {
        super();

        this.addEventListener('load', this._handleModelLoaded);
        this.addEventListener('camera-change', this._handleCameraChanged);

        const singleClickEventHandler = new SingleClickEventHandler(this);
        singleClickEventHandler.on("single-click", this._handleSceneClicked.bind(this));
    }

    firstUpdated() {
        this[$scene].add(this.measurementTool.sceneElementGroup);
        this.measurementTool.on('scene-update-requested', () => this.updateRendering());
        this.measurementTool.on('calculate-hotspot-requested', this._intersectObject.bind(this));
        this.measurementTool.on('hotspot-added', this._handleHotspotAdded.bind(this));
    }

    connectWithSettings(viewerSettings: ViewerSettings): void {
        viewerSettings.modelOrientation.on('model-orientation-changed', (eulerOrientation: EulerYXZ) => {
            this.orientation = eulerOrientation.angleInRadAsString();
            this.measurementTool.eulerOrientation = eulerOrientation;
        });

        viewerSettings.environment3D.on('change-axes-visibility-requested',this._changeAxesVisibility.bind(this));
        viewerSettings.environment3D.on('change-viewer-background-color-requested',this._changeBackgroundColor.bind(this));
        viewerSettings.environment3D.on('change-exposure-requested',(brightness: number) => this.exposure = brightness);

        const [currentBackgroundColor, currentGradientColor] = viewerSettings.environment3D.backgroundColor;
        this._changeBackgroundColor(currentBackgroundColor,currentGradientColor);
    }

    resize(height: number, width: number): void {
        this.style.height = height + 'px';
        this.style.width = width + 'px';

        this[$scene].idealAspect = this[$scene].aspect; //if the format is not "ideal", model-viewer changes the fov values 
    }
    getCamera(): Camera {
        return this[$scene].camera;
    }

    setReferenceFieldOfView(fovInRad: number, updateViewer: boolean = false): void {
        if (fovInRad == this._referenceFieldOfViewInRad) {
            if (updateViewer) {
                this.fieldOfView = fovInRad + "rad";
            }

            return;
        }

        this._referenceFieldOfViewInRad = fovInRad;
        this[$scene].idealAspect = this[$scene].aspect;
        this.minFieldOfView = fovInRad / this._maxZoomLevel + "rad";
        this.maxFieldOfView = fovInRad / this._minZoomLevel + "rad";


        if (updateViewer) {
            this.fieldOfView = fovInRad + "rad";
        }

        //update maxRadius:
        const viewerDim = this.getDimensions();
        const maxLength = Math.sqrt(viewerDim.x * viewerDim.x + viewerDim.y * viewerDim.y + viewerDim.z * viewerDim.z);

        if (this.clientWidth > this.clientHeight) {
            this._referenceMaxRadius = maxLength / fovInRad;
        }
        else {
            this._referenceMaxRadius = maxLength / fovInRad * this.clientHeight / this.clientWidth;
        }

        if (!this._isRadiusConst) {
            this.maxCameraOrbit = "Infinity 157.5deg " + this._referenceMaxRadius + "m";
        }

    }


    rotateModel(dx: number, dy: number): void {
        const conversionFactor = 2 * Math.PI / this[$scene].height;
        const deltaTheta = conversionFactor * dx;
        const deltaPhi = conversionFactor * dy;

        let controls = (this as any)[$controls];
        controls.changeSource = ChangeSource.USER_INTERACTION;
        controls.adjustOrbit(deltaTheta, deltaPhi, 0)
    }

    zoomTo(zoomLevel: number): void {

        if (this._referenceFieldOfViewInRad == -1) {
            console.log("Return 3d  zoom, ", this._currentZoomLevel)
            return;
        }

        this._currentZoomLevel = zoomLevel;
        this[$scene].idealAspect = this[$scene].aspect; //ensure that the idealAspect is equal to aspect
        this.fieldOfView = this._referenceFieldOfViewInRad / zoomLevel + "rad";
    }

    setViewerOffset(deltaX: number, deltaY: number) {
        if (this._deltaX != deltaX || this._deltaY != deltaY) {
            this._deltaX = deltaX;
            this._deltaY = deltaY;

            this[$scene].camera.setViewOffset(this.clientWidth, this.clientHeight, deltaX, deltaY, this.clientWidth, this.clientHeight);
            this.updateRendering();
        }
    }

    updateRendering() {
        this[$scene].queueRender();
    }

    setMinZoomLevel(minZoomLevel: number): void {
        if (this._minZoomLevel == minZoomLevel) {
            return;
        }
        if (this._referenceFieldOfViewInRad != -1) {
            const updatedMaxFov = this._referenceFieldOfViewInRad / minZoomLevel;
            const currentFov = this.getFieldOfView() / 180 * Math.PI;
            if (updatedMaxFov < currentFov) {
                if (this._isRadiusConst == false) {
                    const currentOrbitPos = this.getCameraOrbit();
                    const currentRadius = this.getCameraOrbit().radius;
                    currentOrbitPos.radius = currentRadius * currentFov / updatedMaxFov;
                    this.cameraOrbit = currentOrbitPos.toString();
                }
                else {
                    this.fieldOfView = updatedMaxFov + "rad";
                }
            }

            this.maxFieldOfView = updatedMaxFov + "rad";
            this._minZoomLevel = minZoomLevel;
        }

    }

    setCameraOrbitPos(orbitPos: SphericalPosition): void {
        if (this._isRadiusConst) {
            this.minCameraOrbit = "-Infinity 22.5deg " + orbitPos.radius + "m";
            this.maxCameraOrbit = "Infinity 157.5deg " + orbitPos.radius + "m";
        }

        this.cameraOrbit = orbitPos.toString();
    }

    updateRadiusMode(isRadiusConst: boolean): void {
        if (isRadiusConst == this._isRadiusConst) {
            return;
        }

        this._isRadiusConst = isRadiusConst;

        if (isRadiusConst) {
            const currentRadius = this.getCameraOrbit().radius;
            this.minCameraOrbit = "-Infinity 22.5deg " + currentRadius + "m";
            this.maxCameraOrbit = "Infinity 157.5deg " + currentRadius + "m";
        }
        else {
            this.minCameraOrbit = "-Infinity 22.5deg auto";

            const maxRadiusString = this._referenceMaxRadius > 0 ? this._referenceMaxRadius + "m" : "auto";
            this.maxCameraOrbit = "Infinity 157.5deg " + maxRadiusString;

        }
    }

    private _changeAxesVisibility(showAxes: boolean){
        this._axesHelper.visible = showAxes;
        this.updateRendering();
    }

    private _changeBackgroundColor(backgroundColor:string, gradientColor: string){

        console.log("Change background color",backgroundColor,gradientColor)
        if(gradientColor){
            this.style.background = "radial-gradient(circle at center, "+gradientColor + ", " + backgroundColor+")"; 
        }
        else{
            this.style.background = backgroundColor;
        }
    }

    private _handleHotspotAdded(domElement: HTMLButtonElement)  {

        domElement.addEventListener('hotspot-position-changed',() => {
            this.updateHotspot({name: domElement.slot,position:domElement.dataset.position,normal:domElement.dataset.normal})
        });

        this.appendChild(domElement);
    }

    private _intersectObject(origin: Vector3 ,direction:Vector3){

        let currentCamTargetPos = this.getCameraTarget();
        console.log("Current translation 2",currentCamTargetPos)

        origin.x -= currentCamTargetPos.x;
        origin.y -= currentCamTargetPos.y;
        origin.z -= currentCamTargetPos.z;
        
        this[$scene].remove(this.measurementTool.sceneElementGroup);
        this[$scene].remove(this._axesHelper);
        

        const raycaster = new Raycaster(origin,direction);
        const hits = raycaster.intersectObject(this[$scene], true); 
      
        this[$scene].add(this.measurementTool.sceneElementGroup);
        this[$scene].add(this._axesHelper);
        

        var hit = hits.find((hit) => hit.object.visible && !hit.object.userData.shadow);
    
        if (hit == null || hit.face == null) {
          return ;
        }
      
        let position3D;
        let normal3D;
        if (hit.uv == null) {
          position3D = hit.point;
          normal3D =  hit.face.normal;
        }
        else{
          hit.face.normal.applyNormalMatrix(new Matrix3().getNormalMatrix(hit.object.matrixWorld));
          position3D = hit.point;
          normal3D =  hit.face.normal;
        }
    
        position3D.x += currentCamTargetPos.x;
        position3D.y += currentCamTargetPos.y;
        position3D.z += currentCamTargetPos.z;
    
        this.measurementTool.addPointFrom3DScene(position3D, normal3D, false);
    }

    private _handleSceneClicked(event: MouseEvent) {

        console.log("Single Click")
        if (!this.measurementTool.isEditModeActive) {
            return;
        }

        const x = event.clientX;
        const y = event.clientY;

        this[$scene].remove(this.measurementTool.sceneElementGroup);
        this[$scene].remove(this._axesHelper);
        

        const positionAndNormal = this.positionAndNormalFromPoint(x, y);

        if (positionAndNormal == null) {
            console.log('no hit result: mouse = ', x, ', ', y);
            return;
        }

        this[$scene].add(this.measurementTool.sceneElementGroup);
        this[$scene].add(this._axesHelper);
        

        const { position, normal } = positionAndNormal;

        this.measurementTool.addPointFrom3DScene(position, normal);
    }

    private _handleModelLoaded(): void {
        const dim = this.getDimensions();
        const maxDim = Math.max(Math.max(dim.x, dim.y), dim.z);
        const axesLength = maxDim * 0.5;
        this._axesHelper = new AxesHelper(axesLength);
        this[$scene].add(this._axesHelper);

        this._lastSphericalPosition = this.getCameraOrbit();

        this[$scene].idealAspect = this[$scene].aspect;
        this[$scene].queueRender();

        this._emitCamOrbitAngleChanged();
    }

    private _handleCameraChanged(event: Event): void {

        this.measurementTool.translation = new Vector3().setFromMatrixPosition(this[$scene].target.matrixWorld);

        const currentCamPosition = this.getCameraOrbit();
        const currentFovInDeg = this.getFieldOfView();

        if ((event as CustomEvent).detail.source != "user-interaction") {
            this._lastSphericalPosition = currentCamPosition;
            this._lastFieldOfViewInDeg = currentFovInDeg;
            return;
        }


        //compare just angle and not radius
        if (this._lastSphericalPosition.phi != currentCamPosition.phi || this._lastSphericalPosition.theta != currentCamPosition.theta) {
            console.log("CamChanged", this.getCameraOrbit(), this._lastSphericalPosition); //just emit if orbit angle changed

            if (currentCamPosition.radius > 0) {
                this._emitCamOrbitAngleChanged();
            }
        }
        if (this._lastSphericalPosition.radius == currentCamPosition.radius && this._lastFieldOfViewInDeg != currentFovInDeg) {
            this._currentZoomLevel = this._referenceFieldOfViewInRad * 180 / Math.PI / currentFovInDeg;
            console.log("FOV change", this._currentZoomLevel, this._referenceFieldOfViewInRad * 180 / Math.PI, currentFovInDeg);

            this.dispatchEvent(new CustomEvent('fov-based-zoom-changed', {
                detail: {
                    zoomLevel: this._currentZoomLevel
                }
            }));

        }

        this._lastSphericalPosition = currentCamPosition;
        this._lastFieldOfViewInDeg = currentFovInDeg;
    }

    private _emitCamOrbitAngleChanged: () => void = debounce(() => {
        console.log("Cam Phi Theta", this._lastSphericalPosition.phi * 180 / Math.PI, this._lastSphericalPosition.theta * 180 / Math.PI)
        this.dispatchEvent(new Event('cam-orbit-angle-changed'));
    }, 250);

    static styles = css`
    
    .hotspot{
        display: block;
        width: 20px;
        height: 20px;
        border-radius: 20px;
        border: none;
        background-color: #fff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
        box-sizing: border-box;
        cursor: pointer;
        transition: opacity 0.3s;
        position: relative;
        font-size: 12px;
        padding: 0
    }


    .hotspot:not([data-visible]) {
        background: transparent;
        border: 3px solid #fff;
        box-shadow: none;
        pointer-events: none;
    }


    .hotspot:focus {
        border: 3px solid rgb(0, 128, 200);
        outline: none;
        padding: 0;
    }

    .hotspot > * {
        opacity: 1;
    }
 
 `
}
