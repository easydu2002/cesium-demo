
/**
 * 计算椭球边缘点
 * 
 * @param {*} x1 中心点经度
 * @param {*} y1 中心点纬度
 * @param {*} ch 中心点高度
 * @param {*} radius 椭球XY
 * @param {*} radiusMax 椭球Z 
 * @param {*} heading 旋转角度
 * @param {*} deg 扇形角度
 * @param {*} sd 扇形起始角度
 * @returns 
 */
export function calculatePane(x1, y1, radius, radiusMax, heading, deg, ch, sd) {
    var m = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(x1, y1));
    var rx = radius * Math.cos(heading * Math.PI / 180.0);
    var ry = radius * Math.sin(heading * Math.PI / 180.0);
    heading = Cesium.Math.toRadians(heading)
    var translation = Cesium.Cartesian3.fromElements(rx, ry, 0);
    var d = Cesium.Matrix4.multiplyByPoint(m, translation, new Cesium.Cartesian3());
    var c = Cesium.Cartographic.fromCartesian(d);
    var x2 = Cesium.Math.toDegrees(c.longitude);
    var y2 = Cesium.Math.toDegrees(c.latitude);
    return calculateSector(x1, y1, x2, y2, deg + sd, ch, sd, radiusMax);
}

// 计算竖直扇形
function calculateSector(x1, y1, x2, y2, deg = 90, ch = 0, sd = 0, maxR) {
    const positionArr = []
    
    for (let i = sd; i <= deg; i++) {
        let h = maxR * Math.sin(i * Math.PI / 180.0);
        let r = Math.cos(i * Math.PI / 180.0);
        let x = (x2 - x1) * r + x1;
        let y = (y2 - y1) * r + y1;
        positionArr.push(x);
        positionArr.push(y);
        positionArr.push(h + ch);
    }
    return positionArr;
}

/**
 * 判断某点是否在椭球范围内，暂时不考虑角度范围
 * @param {Cesium.Cartesian3} position 椭球中心点
 * @param {Cesium.Cartesian3} targetPosition 目标点 
 * @param {*} options 
 */
export function isInEllipsoidPoint(position, targetPosition, options) {

    const originLonLat = Cesium.Cartographic.fromCartesian(position)
    const targetLonLat = Cesium.Cartographic.fromCartesian(targetPosition)

    const parseTargetLonLat = Cesium.Cartesian3.fromRadians(targetLonLat.longitude, targetLonLat.latitude, originLonLat.height)
    // 原点 -> 目标点 水平距离
    const originTargetDistance = Cesium.Cartesian3.distance(position, parseTargetLonLat)

    return options.yRadius >= targetLonLat.height
        && options.xRadius >= originTargetDistance

    // return calculatePaneByCartesian(position, {
    //     ...options,
    //     heading: 0,
    //     degrees: 90,
    //     startDegrees: 0,
    // }).some(item => {
    //     const originLonLat = Cesium.Cartographic.fromCartesian(item)

    //     const parseTargetLonLat = Cesium.Cartesian3.fromRadians(targetLonLat.longitude, targetLonLat.latitude, originLonLat.height)
    //     // 原点 -> 目标点 水平距离
    //     const originTargetDistance = Cesium.Cartesian3.distance(item, parseTargetLonLat)

    //     // // 原点 -> 边缘点 水平距离
    //     // const originEdgeDistance = 
        
    //     return options.yRadius >= targetLonLat.height
    //         && options.xRadius >= originTargetDistance
    //     // console.debug('>> test', Cesium.Cartesian3.distance(position, item))
    //     // return Cesium.Cartesian3.distance(position, item) >= distance
    // })

}

/**
 * 
 * @param {Cesium.Cartesian3} position 
 */
export function calculatePaneByCartesian(position, options) {
    const { xRadius, yRadius, degrees, startDegrees, heading } = options
    const { longitude, latitude, height } = Cesium.Cartographic.fromCartesian(position)
    const positionArr = calculatePane(
        Cesium.Math.toDegrees(longitude),
        Cesium.Math.toDegrees(latitude),
        xRadius,
        yRadius,
        heading,
        degrees,
        height,
        startDegrees
    )
    if (!positionArr?.length) return

    return Cesium.Cartesian3.fromDegreesArrayHeights(positionArr)
}