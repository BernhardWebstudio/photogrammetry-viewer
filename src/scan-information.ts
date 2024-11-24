import {Vector3, Matrix3, Matrix4} from 'three';
import {EventEmitter} from 'events';
import {Sensor} from './sensor';

export class ScanInformation extends EventEmitter {
  isValid: boolean = false;

  sensorMap = new Map<string, Sensor>();
  sensorIds: Array<string> = [];

  imageFiles: Array<string> = [];
  camPosesInChunk: Array<Matrix4> = [];
  transformationChunkToWorld: Matrix4 = new Matrix4();

  private _xhttp: XMLHttpRequest = new XMLHttpRequest();
  private _xmlDoc: Document | null = null;

  constructor() {
    super();
    this._xhttp.onload = this._extractInformation.bind(this);
  }

  readFromFile(filename: string) {
    this._xhttp.open('GET', filename, true); // true = async!;
    this._xhttp.send();
  }

  private _extractInformation(): void {
    this.isValid = false;

    if (this._xhttp.status != 200) {
      console.log('Coudn\'t read xml file');
      return;
    }

    this._xmlDoc = this._xhttp.responseXML;

    if (this._xmlDoc == null) {
      console.log('Xml of scaninformation is not valid');
      return;
    }

    // 1. extract intrinsic camera params
    if (!this._extractIntrinsicCameraInformation()) {
      console.log('Coudn\'t extract intrinsic camera information from xml document');
      return;
    }

    // 2. extract extrinsic camera params
    if (!this._extractExtrinsicCameraInformation()) {
      console.log('Coudn\'t extract extrinisc camera information from xml document');
      return;
    }

    this.isValid = true;

    this.emit('scanInformationExtracted');
  }

  private _extractIntrinsicCameraInformation(): boolean {
    if (this._xmlDoc == null) {
      return false;
    }

    const sensors = this._xmlDoc.getElementsByTagName('sensor');
    if (sensors.length == 0) {
      console.log('No sensors found in xml document');
      return false;
    }

    for (let i = 0; i < sensors.length; i++) {
      const sensorId = sensors[i].getAttribute('id');
      if (sensorId == null) {
        console.log('Sensor Element in xml doesn\'t contain key "id"', i, sensors[i]);
        return false;
      }

      const calibration = getFirstElementOfTagName(sensors[i], 'calibration');
      if (calibration == null) {
        return false;
      }

      const resolution = getFirstElementOfTagName(calibration, 'resolution');
      if (resolution == null) {
        return false;
      }

      const sensorWidthInPx = getAttributeAsNumber(resolution, 'width');
      const sensorHeightInPx = getAttributeAsNumber(resolution, 'height');

      if (sensorWidthInPx == null || sensorHeightInPx == null) {
        console.log('XML Document doesn\'t contain information about sensor width and height');
        return false;
      }

      const focalLengthElement = getFirstElementOfTagName(calibration, 'f');
      if (focalLengthElement == null || focalLengthElement.textContent == null) {
        console.log('XML Document doesn\'t contain information about the field of view', focalLengthElement);
        return false;
      }

      const focalLengthInPx = Number(focalLengthElement.textContent);
      if (Number.isNaN(focalLengthInPx) || focalLengthInPx <= 0) {
        console.log('XML Document doesn\'t contain valid information about the field of view:', focalLengthInPx);
        return false;
      }

      this.sensorMap.set(sensorId, new Sensor(focalLengthInPx, sensorWidthInPx, sensorHeightInPx));
    }


    return true;
  }

  private _extractExtrinsicCameraInformation(): boolean {
    if (this._xmlDoc == null) {
      return false;
    }

    // 1 extract params for the transformation chunk (default agisoft coor. system) to world coordinate system
    if (!this._extractChunkToWorldCoorTransformation()) {
      console.log('Coudn\'t extract transformation chunk to world coordinate system from xml document');
      return false;
    }

    if (!this._extractCamPoses()) {
      console.log('Coudn\'t extract cam poses information from xml document');
      return false;
    }

    return true;
  }

  private _extractChunkToWorldCoorTransformation(): boolean {
    if (this._xmlDoc == null) {
      return false;
    }

    const transformElement = getLastElementOfTagName(this._xmlDoc, 'transform');
    if (transformElement == null) {
      return false;
    }

    // 1. rotation part:
    const rotationElement = getFirstElementOfTagName(transformElement, 'rotation');
    if (rotationElement == null || rotationElement.textContent == null) {
      console.log('XML Document doesn\'t contain valid information about the rotation between chunk and world coordinate system', rotationElement);
      return false;
    }

    const rotationChunkAsStringArray = rotationElement.textContent.split(' ');
    const rotationChunkAsNumberArray = rotationChunkAsStringArray.map((str) => {
      return Number(str);
    });

    if (rotationChunkAsNumberArray.length != 9) {
      console.log('Rotation part of chunk doesn\'t contain 9 numbers:', rotationChunkAsNumberArray);
      return false;
    }

    // Sets the elements of this matrix based on an array in column-major format, but agisoft array is in row-majow format -> transpose funtion ist needed:
    const rotationChunkAsMat = new Matrix3();
    rotationChunkAsMat.fromArray(rotationChunkAsNumberArray).transpose();

    // 2. scale part:
    const scaleElement = getFirstElementOfTagName(transformElement, 'scale');
    if (scaleElement == null || scaleElement.textContent == null) {
      console.log('XML Document doesn\'t contain valid information about the scaling between chunk and world coordinate system', scaleElement);
      return false;
    }

    const scaleFactor = Number(scaleElement.textContent);
    if (scaleFactor <= 0) {
      console.log('Scalefactor in xml document is not valid: ', scaleFactor);
      return false;
    }
    rotationChunkAsMat.multiplyScalar(scaleFactor);

    // 3. translation part:
    const translationElement = getFirstElementOfTagName(transformElement, 'translation');
    if (translationElement == null || translationElement.textContent == null) {
      console.log('XML Document doesn\'t contain valid information about the translation between chunk and world coordinate system', translationElement);
      return false;
    }

    const translationChunkAsStringArray = translationElement.textContent.split(' ');
    const translationChunkAsNumberArray = translationChunkAsStringArray.map((str) => {
      return Number(str);
    });

    if (translationChunkAsNumberArray.length != 3) {
      console.log('Translation part of chunk doesn\'t contain 3 numbers:', translationChunkAsNumberArray);
      return false;
    }
    const translationChunkAsVector = new Vector3(translationChunkAsNumberArray[0], translationChunkAsNumberArray[1], translationChunkAsNumberArray[2]);

    // 4. Merge the individual parts into a 4x4 transformation.
    this.transformationChunkToWorld.setFromMatrix3(rotationChunkAsMat);
    this.transformationChunkToWorld.setPosition(translationChunkAsVector);

    return true;
  }

  private _extractCamPoses(): boolean {
    if (this._xmlDoc == null) {
      return false;
    }

    const cameras = this._xmlDoc.getElementsByTagName('camera');
    if (cameras.length == 0) {
      console.log('No cameras found in xml document');
      return false;
    }

    this.imageFiles.length = cameras.length;
    this.camPosesInChunk.length = cameras.length;
    this.sensorIds.length = cameras.length;

    //  transform
    for (let i = 0; i < cameras.length; i++) {
      const imageFileName = cameras[i].getAttribute('label');
      if (imageFileName == null) {
        console.log('Camera Element in xml doesn\'t contain key "label"', i, cameras[i]);
        return false;
      }

      this.imageFiles[i] = imageFileName;

      const sensorId = cameras[i].getAttribute('sensor_id');
      if (sensorId == null) {
        console.log('Camera Element in xml doesn\'t contain key "sensor_id"', i, cameras[i]);
        return false;
      }

      if (this.sensorMap.has(sensorId) == false) {
        console.log('Sensor with id', sensorId, 'doesn\'t exist in xml file');
        return false;
      }

      this.sensorIds[i] = sensorId;


      const transformationElement = getFirstElementOfTagName(cameras[i], 'transform');
      if (transformationElement == null || transformationElement.textContent == null) {
        console.log('Camera Element in xml doesn\'t contain transformationElement', i, cameras[i]);
        return false;
      }

      const transformMatAsStringArray = transformationElement.textContent.split(' ');
      const transformMatAsNumberArray = transformMatAsStringArray.map((str) => {
        return Number(str);
      });

      if (transformMatAsNumberArray.length != 16) {
        console.log('cam pose doesn\'t contain 16 numbers:', i, transformMatAsNumberArray);
        return false;
      }

      // Sets the elements of this matrix based on an array in column-major format, but agisoft array is in row-majow format -> transpose funtion ist needed:
      this.camPosesInChunk[i] = new Matrix4();
      this.camPosesInChunk[i].fromArray(transformMatAsNumberArray).transpose();
    }

    return true;
  }
}

/**
 *     HELPER-FUNCTIONS
 */

function getFirstElementOfTagName(xmlElement: Document | Element, qualifiedName: string): Element | null {
  const allElements = xmlElement.getElementsByTagName(qualifiedName);
  if (allElements.length == 0) {
    console.log('XML Document doesn\'t contain valid element with name', qualifiedName);
    return null;
  } else {
    return allElements[0];
  }
}

function getLastElementOfTagName(xmlElement: Document | Element, qualifiedName: string): Element | null {
  const allElements = xmlElement.getElementsByTagName(qualifiedName);
  if (allElements.length == 0) {
    console.log('XML Document doesn\'t contain valid element with name', qualifiedName);
    return null;
  } else {
    return allElements[allElements.length - 1];
  }
}

function getAttributeAsNumber(xmlElement: Element, qualifiedName: string): number | null {
  const attributeAsString = xmlElement.getAttribute(qualifiedName);
  const attributeAsNumber = attributeAsString ? Number(attributeAsString) : null;
  return attributeAsNumber;
}


