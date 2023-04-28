import { viewer } from "../../base.js"
import { createApp, reactive } from 'https://unpkg.com/petite-vue?module'
import debounce from 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/debounce/+esm'
import { calculatePaneByCartesian, isInEllipsoidPoint } from "./rader-solid-scan.js"

/**
 * 雷达半球配置
 */
const options = reactive({

  radiiZ: 1000,
  radiiXY: 1000,
  innerRadiiZ: 1,
  innerRadiiXY: 1,

  material: {
    // type 
    color: '#ffff00',
    alpha: 0.4,
  },

  outline: true,
  outlineColor: '#ffff00',
  outlineAlpha: 1,

})

/**
 * 扫描扇形配置
 */
const scanOptions = reactive({

  minimumCone: 0,
  maximumCone: 90,
  startClock: 0,
  clock: 30,

  outline: false,
  outlineColor: '#ff0000',
  outlineAlpha: 1,

  scanType: '3d',

  material: {
    color: '#ffff00',
    alpha: 0.8
  },

  enableTrack: true,

  get minimumClock() {
    return -Math.abs(this.startClock - this.clock) / 2
  },
  get maximumClock() {
    return Math.abs(this.startClock - this.clock) / 2
  },
})

createApp({ 
  options,
  scanOptions,
  update: debounce(() => {
    updateEllipsoid(ellipsoid)
    updateScan(scanEntity)
  }, 233),
}).mount()

/**
 * 
 * @param {[number, number, number]} lonLat
 */
function addEllipsoid(lonLat) {

  const ellipsoid = new Cesium.Entity({
    position: Cesium.Cartesian3.fromDegrees(lonLat[0], lonLat[1], lonLat[2]),
    ellipsoid: new Cesium.EllipsoidGraphics({
      radii: new Cesium.ConstantProperty(),
      innerRadii: new Cesium.ConstantProperty(),
      minimumCone: Cesium.Math.toRadians(0),
      maximumCone: Cesium.Math.toRadians(90),
      outline: new Cesium.ConstantProperty(),
      outlineColor: new Cesium.ConstantProperty(),
      material: new Cesium.ColorMaterialProperty(Cesium.Color.BLACK),
    })
  })

  updateEllipsoid(ellipsoid)

  return viewer.entities.add(ellipsoid)
}

/**
 * 允许被扫描的实体集合
 * @type {Array<Cesium.Entity>}
 */
const trackEntityList = []

/**
 * 
 * @param {Cesium.Entity} entity 
 */
function updateEllipsoid(entity) {

  entity.ellipsoid.radii.setValue(new Cesium.Cartesian3(options.radiiXY, options.radiiXY, options.radiiZ))
  entity.ellipsoid.innerRadii.setValue(new Cesium.Cartesian3(options.innerRadiiXY, options.innerRadiiXY, options.innerRadiiZ))

  entity.ellipsoid.outline.setValue(options.outline)
  entity.ellipsoid.outlineColor.setValue(Cesium.Color.fromCssColorString(options.outlineColor).withAlpha(options.outlineAlpha))
  
  entity.ellipsoid.material.color.setValue(Cesium.Color.fromCssColorString(options.material.color).withAlpha(options.material.alpha))
}

/**
 * 
 * @param {Cesium.Entity} scanEntity 
 */
function updateScan(scanEntity) {
  scanEntity.ellipsoid.show = scanOptions.scanType === '3d'
  scanEntity.ellipsoid.radii.setValue(new Cesium.Cartesian3(options.radiiXY, options.radiiXY, options.radiiZ))
  scanEntity.ellipsoid.innerRadii.setValue(new Cesium.Cartesian3(options.innerRadiiXY, options.innerRadiiXY, options.innerRadiiZ))
  
  scanEntity.ellipsoid.minimumCone.setValue(Cesium.Math.toRadians(scanOptions.minimumCone))
  scanEntity.ellipsoid.maximumCone.setValue(Cesium.Math.toRadians(scanOptions.maximumCone))
  scanEntity.ellipsoid.minimumClock.setValue(Cesium.Math.toRadians(scanOptions.minimumClock))
  scanEntity.ellipsoid.maximumClock.setValue(Cesium.Math.toRadians(scanOptions.maximumClock))
  
  scanEntity.ellipsoid.outline.setValue(scanOptions.outline)
  scanEntity.ellipsoid.outlineColor.setValue(Cesium.Color.fromCssColorString(scanOptions.outlineColor).withAlpha(scanOptions.outlineAlpha))
  
  scanEntity.ellipsoid.material.color.setValue(Cesium.Color.fromCssColorString(scanOptions.material.color).withAlpha(scanOptions.material.alpha))

  scanEntity.polygon.show = scanOptions.scanType === '2d'
  scanEntity.polygon.material.color.setValue(Cesium.Color.fromCssColorString(scanOptions.material.color).withAlpha(scanOptions.material.alpha))
  
  scanEntity.polygon.outline.setValue(scanOptions.outline)
  scanEntity.polygon.outlineColor.setValue(Cesium.Color.fromCssColorString(scanOptions.outlineColor).withAlpha(scanOptions.outlineAlpha))
  
  scanEntity.polyline.show = scanOptions.enableTrack
  

}


/**
 * 
 * @param {Cesium.Entity} entity 
 */
function addScan(entity) {

  let deg = 0
  let step = 360 / 60 / 10

  const scanEntity = new Cesium.Entity({
    position: entity.position.getValue(viewer.clock.currentTime),
    orientation: new Cesium.CallbackProperty(() => {
      const hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(deg += step), 0, 0)
      return Cesium.Transforms.headingPitchRollQuaternion(entity.position.getValue(viewer.clock.currentTime), hpr)
    }, false),
    ellipsoid: new Cesium.EllipsoidGraphics({
      radii: new Cesium.ConstantProperty(),
      innerRadii: new Cesium.ConstantProperty(),
      minimumCone: new Cesium.ConstantProperty(),
      maximumCone: new Cesium.ConstantProperty(),
      minimumClock: new Cesium.ConstantProperty(),
      maximumClock: new Cesium.ConstantProperty(),
      outline: new Cesium.ConstantProperty(),
      outlineColor: new Cesium.ConstantProperty(),
      material: new Cesium.ColorMaterialProperty(Cesium.Color.BLACK),
    }),
    polyline: new Cesium.PolylineGraphics({
      positions: new Cesium.CallbackProperty(() => {
        for (let i = 0; i < trackEntityList.length; i++) {
          const orientPosition = entity.position.getValue(viewer.clock.currentTime)
          const targetPosition = trackEntityList[i].position.getValue(viewer.clock.currentTime)
          
          
          const isContains = isInEllipsoidPoint(orientPosition, targetPosition, {
            xRadius: options.radiiXY, 
            yRadius: options.radiiZ, 
          })
          if (isContains) {
            return [orientPosition, targetPosition]
          }
        }
      }),
      width: 4,
      material: Cesium.Color.RED.withAlpha(.8)
    }, false),
    polygon: new Cesium.PolygonGraphics({
      hierarchy: new Cesium.CallbackProperty(() => {
        const centerPosition = scanEntity.position.getValue(viewer.clock.currentTime)
        const positions = calculatePaneByCartesian(centerPosition, {
          xRadius: options.radiiXY, 
          yRadius: options.radiiZ, 
          degrees: scanOptions.maximumCone, 
          startDegrees: scanOptions.minimumCone,
          heading: deg += step
        })
        positions.unshift(centerPosition)
        return new Cesium.PolygonHierarchy(positions)
      }, false),
      perPositionHeight: true,
      heightReference: Cesium.HeightReference.NONE,
      material: new Cesium.ColorMaterialProperty(Cesium.Color.BLACK),
      outline: new Cesium.ColorMaterialProperty(Cesium.Color.BLACK),
      outline: new Cesium.ConstantProperty(),
      outlineColor: new Cesium.ConstantProperty(),
    })
  })

  updateScan(scanEntity)

  return viewer.entities.add(scanEntity)

}

const ellipsoid = addEllipsoid([108.9426, 34.2716, 0])
const scanEntity = addScan(ellipsoid)
window.viewer=viewer
viewer.zoomTo(ellipsoid)

const dataSource = new Cesium.CzmlDataSource();
viewer.dataSources.add(dataSource);

dataSource.process('/radar-scan-3d/plane.czml')
  .then(dataSource => {
    trackEntityList.push(...dataSource.entities.values)
  })
