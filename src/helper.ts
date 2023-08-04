import { EventEmitter } from "events";

export const debounce = (func: Function, delay = 250) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};



export function doubleEventHandler(callback: (...args: any[]) => void, delay: number = 300): () => void {
  let numEventCalls = 0;
  let timeoutId: number;

  return function (...args: any[]) {
    numEventCalls++;

    if (numEventCalls === 1) {
      //single event call
      timeoutId = window.setTimeout(() => {
        numEventCalls = 0;
      }, delay);
    } else {
      window.clearTimeout(timeoutId);
      // Double event call
      callback(...args);
      numEventCalls = 0;
    }
  };
}


export class SingleClickEventHandler extends EventEmitter {

  private _isHoldEvent: boolean = false;

  private _holdTimeoutId: number = -1;
  private _doubleClickTimeoutId: number = -1;

  private _delay: number;
  private _numClick = 0;

  constructor(parentElement: HTMLElement, pointerDownFunction: string = 'mousedown', pointerUpFunction: string = 'click', delay: number = 100) {
    super();
    parentElement.addEventListener(pointerDownFunction, this._handleMouseDown.bind(this));
    parentElement.addEventListener(pointerUpFunction, this._handleMouseClick.bind(this));

    this._delay = delay;
  }

  private _handleMouseDown() {
    //reset  event settings:
    this._isHoldEvent = false;
    window.clearTimeout(this._doubleClickTimeoutId);

    this._holdTimeoutId = window.setTimeout(() => {
      this._isHoldEvent = true;
    }, this._delay);
  }

  
  private _handleMouseClick(event: any) {

    if (this._isHoldEvent) {
      this._numClick = 0;
      this._isHoldEvent = false;
      return;
    }

    window.clearTimeout(this._holdTimeoutId);
    
    this._numClick++;

    if (this._numClick === 1) {
      //single click event call
      this._doubleClickTimeoutId = window.setTimeout(() => {
        this._numClick = 0;
        this.emit('single-click', event);
      }, this._delay);
    } else {
      // Double click event call
      this._numClick = 0;
      this.emit('double-click', event);
    }
  }

}

