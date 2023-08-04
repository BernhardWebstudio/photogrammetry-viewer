import { Vector3, Matrix4, Quaternion, Camera, Vector2, Euler } from 'three'
import { ScanInformation } from './scan-information';
import { Settings2DViewer, Settings3DViewer } from './sync-settings';
import { SphericalPosition } from '@google/model-viewer/lib/features/controls';
import { Sensor } from './sensor'
import { toVector3D } from '@google/model-viewer/lib/model-viewer-base';
import { EventEmitter } from 'events';
import { EulerYXZ } from './eulerYXZ';


export class ImageCamera extends EventEmitter {

    //extrinsic:
    poses: Array<Matrix4> = [];
    normedPositions: Array<Vector3> = [];

    private _sensorMap = new Map<string, Sensor>();
    private _sensorIds: Array<string> = [];

    private _camPosesInChunk: Array<Matrix4> = [];
    private _chunkToWorldTransform: Matrix4 = new Matrix4();
    private _isYupTransformApplied: boolean = true;
    private _additionalRotation: Matrix4 = new Matrix4();


    init(scanInformation: ScanInformation, isYupTransformApplied: boolean, additionalRotation: Euler) {
        this._sensorMap = scanInformation.sensorMap;
        this._sensorIds = scanInformation.sensorIds;

        this._camPosesInChunk = scanInformation.camPosesInChunk;
        this._chunkToWorldTransform = scanInformation.transformationChunkToWorld;
        this._isYupTransformApplied = isYupTransformApplied;
        this._additionalRotation = this._additionalRotation.makeRotationFromEuler(additionalRotation);
        this._calculateCamPosesInWorldCoor();
    }

    setIsYupTransformApplied(isYupTransformApplied: boolean): void {
        if (isYupTransformApplied == this._isYupTransformApplied) {
            return;
        }
        this._isYupTransformApplied = isYupTransformApplied;
        this._calculateCamPosesInWorldCoor();
        this.emit('camera-parameters-changed');
    }

    setAdditionalRotation(additionalRotation: EulerYXZ): void {
        console.log("Set additional rotation")
        this._additionalRotation = this._additionalRotation.makeRotationFromEuler(additionalRotation.angleInRad);
        this._calculateCamPosesInWorldCoor();
        this.emit('camera-parameters-changed');
    }

    getImageSensor(imageIdx: number): Sensor | undefined{
        const sensorId = this._sensorIds[imageIdx];
        return this._sensorMap.get(sensorId);
    }

    getCameraPose(imageIdx: number): Matrix4{
        if(imageIdx < this.poses.length && imageIdx >= 0){
            return this.poses[imageIdx];
        }
        else{
            return new Matrix4();
        }
    }

    getSyncSettingsOfNextBestImage(viewerCamera: Camera): [Settings2DViewer, Settings3DViewer] | [null, null] {

        const current3DCamPosition = viewerCamera.position;
        let normed3DCamPosition = current3DCamPosition.clone().normalize();

        //1. get next best image idx
        let minAngle = Number.MAX_VALUE;
        let idxMinAngle = -1;
        for (let i = 0; i < this.normedPositions.length; i++) {
            const angle = Math.acos(normed3DCamPosition.dot(this.normedPositions[i]));  //faster than .angleTo, as the vectors are already normalised
            if (angle < minAngle) {
                minAngle = angle
                idxMinAngle = i;
            }
        }

        if (idxMinAngle == -1) {
            return [null, null];
        }

        //1. extract image pose of next best image
        let xDirImageCam = new Vector3(), yDirImageCam = new Vector3(), zDirImageCam = new Vector3(); 
        this.poses[idxMinAngle].extractBasis(xDirImageCam, yDirImageCam, zDirImageCam);

        //2. extract image pose of next best image
        const phiImageCam = Math.acos(-zDirImageCam.y);
        let thetaImageCam = Math.atan2(-zDirImageCam.x, -zDirImageCam.z); 

        //calculate ideal spherical x and y axis:
        let unrotatedImgCamAxisX = new Vector3(Math.cos(thetaImageCam), 0, -Math.sin(thetaImageCam));
        let unrotatedImgCamAxisY = new Vector3(-Math.cos(phiImageCam) * Math.sin(thetaImageCam), Math.sin(phiImageCam), -Math.cos(phiImageCam) * Math.cos(thetaImageCam))

        //project x camera axis to ideal rotated x and y acis
        let projectedXDirCam2D = new Vector2();
        projectedXDirCam2D.x = xDirImageCam.dot(unrotatedImgCamAxisX);
        projectedXDirCam2D.y = xDirImageCam.dot(unrotatedImgCamAxisY);
        projectedXDirCam2D.normalize();

        //calculate rotation angle:
        const rotAngle = Math.atan2(projectedXDirCam2D.y, projectedXDirCam2D.x) * 180 / Math.PI;

        let imageCamPos = new Vector3();
        imageCamPos.setFromMatrixPosition(this.poses[idxMinAngle]);
        const radius = imageCamPos.length();

        let sphericalPos: SphericalPosition = {
            theta: thetaImageCam, phi: phiImageCam, radius: radius, toString() {
                return `${this.theta}rad ${this.phi}rad ${this.radius}m`;
            }
        };

        let camTargetPos = new Vector3();
        camTargetPos.x = imageCamPos.x - radius * Math.sin(phiImageCam) * Math.sin(thetaImageCam);
        camTargetPos.y = imageCamPos.y - radius * Math.cos(phiImageCam);
        camTargetPos.z = imageCamPos.z - radius * Math.sin(phiImageCam) * Math.cos(thetaImageCam);

        const sensorId = this._sensorIds[idxMinAngle];
        const sensor = this._sensorMap.get(sensorId);

        let fov = Math.PI * 0.25; //Default fov
        let aspectRatio = 1; //default aspect ratio

        if (sensor != undefined) {
            fov = sensor.fovInRad;
            aspectRatio = sensor.aspectRatio;
        }


        const settings2D: Settings2DViewer = { imageIdx: idxMinAngle, rotationAngle: -rotAngle, imageAspectRatio: aspectRatio } 
        const settings3D: Settings3DViewer = { orbitPos: sphericalPos, cameraTarget: toVector3D(camTargetPos), fovInRad: fov };

        return [settings2D, settings3D];
    }


    private _calculateCamPosesInWorldCoor(): void {

        var transformationChunkToWorldYUp = this._chunkToWorldTransform.clone();

        if (this._isYupTransformApplied) {
            var transformationZupToYup = new Matrix4();
            transformationZupToYup.makeRotationX(-Math.PI * 0.5);

            transformationChunkToWorldYUp.premultiply(transformationZupToYup);
        }

        let tmpPos = new Vector3();
        let tmpQuart = new Quaternion();
        let tmpScale = new Vector3();
        this.poses.length = this._camPosesInChunk.length;
        this.normedPositions.length = this._camPosesInChunk.length;

        for (let i = 0; i < this._camPosesInChunk.length; i++) {

            let camPoseInWorldScaled = new Matrix4();
            camPoseInWorldScaled.multiplyMatrices(transformationChunkToWorldYUp, this._camPosesInChunk[i]);

            camPoseInWorldScaled.premultiply(this._additionalRotation);

            //decompose to remove scaling
            camPoseInWorldScaled.decompose(tmpPos, tmpQuart, tmpScale);
            var correctedScaleValue = new Vector3(1, 1, 1);
            tmpPos.multiplyScalar(1000); //m to mm

            let camPoseInWorld = new Matrix4();
            camPoseInWorld.compose(tmpPos, tmpQuart, correctedScaleValue);
            this.poses[i] = camPoseInWorld;

            let camPosition = new Vector3();
            camPosition.setFromMatrixPosition(camPoseInWorld);

            this.normedPositions[i] = camPosition.normalize();
        }
    }
}

