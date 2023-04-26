/// <reference path="./Cesium.d.ts"/>

const viewer = new Cesium.Viewer('cesiumContainer', {
  scene3DOnly: true,
  selectionIndicator: false,
  baseLayerPicker: false,
});

Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(80, 22, 130, 50)

export { viewer }
