declare module '*.svg' {
  const content: string;
  export default content;
}
declare module '*.svg?raw' {
  const contents: string;
  export = contents;
}
