declare namespace CoordinatesInputModuleCssNamespace {
  export interface ICoordinatesInputModuleCss {
    coordinateInput: string;
  }
}

declare const CoordinatesInputModuleCssModule: CoordinatesInputModuleCssNamespace.ICoordinatesInputModuleCss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: CoordinatesInputModuleCssNamespace.ICoordinatesInputModuleCss;
};

export = CoordinatesInputModuleCssModule;
