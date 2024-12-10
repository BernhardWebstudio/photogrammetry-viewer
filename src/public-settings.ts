export interface PhotogrammetryViewerSettings {
  resolve2dFileURL(key: string): Promise<string>;
  skyBoxImage: string | null;
}

export class DefaultPhotogrammetryViewerSettings implements PhotogrammetryViewerSettings {
  constructor(private projectRoot: string, private imageType: string) {}
  skyBoxImage: string | null = null;

  resolve2dFileURL(key: string): Promise<string> {
    return new Promise((resolve, _) => {
      resolve(this.projectRoot + key + this.imageType);
    });
  }
}
