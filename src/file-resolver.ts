export interface FileResolver {
  resolveFile(key: string): Promise<string>;
}

export class DefaultFileResolver implements FileResolver {
  constructor(private projectRoot: string, private imageType: string) {}

  resolveFile(key: string): Promise<string> {
    return new Promise((resolve, _) => {
      resolve(this.projectRoot + key + this.imageType);
    });
  }
}
