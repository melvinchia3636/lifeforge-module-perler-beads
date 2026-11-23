export interface Contract {
  images: {
    match: EndpointImagesMatch;
    process: EndpointImagesProcess;
  };
}
export interface EndpointImagesMatch {
  method: "get";
  input: {
    query?: EndpointImagesMatch_InputQuery;
  };
  output: {
    OK: EndpointImagesMatch_OutputOK;
  };
  media: null;
}
export interface EndpointImagesMatch_InputQuery {
  key: string;
  width: string;
  height: string;
  offsetX?: string;
  offsetY?: string;
  maxColors?: string;
}
export interface EndpointImagesMatch_OutputOK {
  grid: string[][];
}
export interface EndpointImagesProcess {
  method: "post";
  input: {};
  output: {
    CREATED: EndpointImagesProcess_OutputCREATED;
  };
  media: {image: {optional: false}};
}
export interface EndpointImagesProcess_OutputCREATED {
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  thumbs: {
    size: string;
    key: string;
    width: number;
    height: number;
  }[];
}
