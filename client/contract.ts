export interface Contract {
  blueprints: {
    create: EndpointBlueprintsCreate;
    list: EndpointBlueprintsList;
    update: EndpointBlueprintsUpdate;
  };
  images: {
    match: EndpointImagesMatch;
    process: EndpointImagesProcess;
  };
}
export interface EndpointBlueprintsCreate {
  method: "post";
  input: {
    body?: EndpointBlueprintsCreate_InputBody;
  };
  output: {
    CREATED: EndpointBlueprintsCreate_OutputCREATED;
  };
  media: null;
}
export interface EndpointBlueprintsCreate_InputBody {
  name: string;
  width: number;
  height: number;
  grid: string[][];
}
export interface EndpointBlueprintsCreate_OutputCREATED {
  id: string;
  name: string;
  width: number;
  height: number;
  grid: string[][];
  created: string;
}
export interface EndpointBlueprintsList {
  method: "get";
  input: {
    query?: EndpointBlueprintsList_InputQuery;
  };
  output: {
    OK: EndpointBlueprintsList_OutputOK;
  };
  media: null;
}
export interface EndpointBlueprintsList_InputQuery {
  page: string;
  q?: string;
}
export interface EndpointBlueprintsList_OutputOK {
  items: {
    id: string;
    name: string;
    width: number;
    height: number;
    grid: string[][];
    created: string;
  }[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}
export interface EndpointBlueprintsUpdate {
  method: "post";
  input: {
    query?: EndpointBlueprintsUpdate_InputQuery;
    body?: EndpointBlueprintsUpdate_InputBody;
  };
  output: {
    OK: EndpointBlueprintsUpdate_OutputOK;
  };
  media: null;
}
export interface EndpointBlueprintsUpdate_InputQuery {
  id: string;
}
export interface EndpointBlueprintsUpdate_InputBody {
  name?: string;
  width?: number;
  height?: number;
  grid?: string[][];
}
export interface EndpointBlueprintsUpdate_OutputOK {
  id: string;
  name: string;
  width: number;
  height: number;
  grid: string[][];
  created: string;
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
  brightness?: string;
  contrast?: string;
  saturation?: string;
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
