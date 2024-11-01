

export interface FileResolver {
    resolveFile(key:string): string;
}

export class DefaultFileResolver implements FileResolver {

  constructor(private projectRoot: string, private imageType: string) {}
  
  resolveFile(key: string): string {
    return this.projectRoot + key + this.imageType;
  }

}
