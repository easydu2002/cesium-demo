/// <reference path="./Cesium.d.ts"/>

const viewer = new Cesium.Viewer('cesiumContainer', {
  scene3DOnly: true,
  selectionIndicator: false,
  baseLayerPicker: false,
  imageryProvider: Cesium.UrlTemplateImageryProvider({
    url : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    subdomains : ['0','1','2','3'],
    tilingScheme : new Cesium.WebMercatorTilingScheme()
  })

});

viewer.scene.debugShowFramesPerSecond = true

Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(80, 22, 130, 50)

export { viewer }
