exports.SVGNS = 'http://www.w3.org/2000/svg'
;(function () {
  const values = [
    0.5,
    0.7,
    0.1,
    0.2,
    0.8,
    0.4,
    0.9,
    0.3,
    0.6,
    0.01,
    0.99,
    0.68,
    0.38,
    0.18,
    0.77,
    0.91,
    0.53,
    0.22,
    0.47
  ]
  function r () {
    r.seed++
    return values[r.seed % values.length]
  }
  r.seed = 0
  //	Math.random = r;
})()

exports.clamp = (x, min, max) => {
  return Math.max(min, Math.min(max, x))
}

exports.clampColor = x => {
  return exports.clamp(x, 0, 255)
}

exports.distanceToDifference = (distance, pixels) => {
  return Math.pow(distance * 255, 2) * (3 * pixels)
}

exports.differenceToDistance = (difference, pixels) => {
  return Math.sqrt(difference / (3 * pixels)) / 255
}

exports.difference = (data, dataOther) => {
  let sum = 0
  let diff
  for (let i = 0; i < data.data.length; i++) {
    if (i % 4 == 3) {
      continue
    }
    diff = dataOther.data[i] - data.data[i]
    sum = sum + diff * diff
  }

  return sum
}

function computeColor (offset, imageData, alpha) {
  let color = [0, 0, 0]
  let { shape, current, target } = imageData
  let shapeData = shape.data
  let currentData = current.data
  let targetData = target.data

  let si,
    sx,
    sy,
    fi,
    fx,
    fy /* shape-index, shape-x, shape-y, full-index, full-x, full-y */
  let sw = shape.width
  let sh = shape.height
  let fw = current.width
  let fh = current.height
  let count = 0

  for (sy = 0; sy < sh; sy++) {
    fy = sy + offset.top
    if (fy < 0 || fy >= fh) {
      continue
    } /* outside of the large canvas (vertically) */

    for (sx = 0; sx < sw; sx++) {
      fx = offset.left + sx
      if (fx < 0 || fx >= fw) {
        continue
      } /* outside of the large canvas (horizontally) */

      si = 4 * (sx + sy * sw) /* shape (local) index */
      if (shapeData[si + 3] == 0) {
        continue
      } /* only where drawn */

      fi = 4 * (fx + fy * fw) /* full (global) index */
      color[0] += (targetData[fi] - currentData[fi]) / alpha + currentData[fi]
      color[1] +=
        (targetData[fi + 1] - currentData[fi + 1]) / alpha + currentData[fi + 1]
      color[2] +=
        (targetData[fi + 2] - currentData[fi + 2]) / alpha + currentData[fi + 2]

      count++
    }
  }

  return color.map(x => ~~(x / count)).map(exports.clampColor)
}

function computeDifferenceChange (offset, imageData, color) {
  let { shape, current, target } = imageData
  let shapeData = shape.data
  let currentData = current.data
  let targetData = target.data

  let a, b, d1r, d1g, d1b, d2r, d2b, d2g
  let si, sx, sy, fi, fx, fy /* shape-index, shape-x, shape-y, full-index */
  let sw = shape.width
  let sh = shape.height
  let fw = current.width
  let fh = current.height

  var sum = 0 /* V8 opt bailout with let */

  for (sy = 0; sy < sh; sy++) {
    fy = sy + offset.top
    if (fy < 0 || fy >= fh) {
      continue
    } /* outside of the large canvas (vertically) */

    for (sx = 0; sx < sw; sx++) {
      fx = offset.left + sx
      if (fx < 0 || fx >= fw) {
        continue
      } /* outside of the large canvas (horizontally) */

      si = 4 * (sx + sy * sw) /* shape (local) index */
      a = shapeData[si + 3]
      if (a == 0) {
        continue
      } /* only where drawn */

      fi = 4 * (fx + fy * fw) /* full (global) index */

      a = a / 255
      b = 1 - a
      d1r = targetData[fi] - currentData[fi]
      d1g = targetData[fi + 1] - currentData[fi + 1]
      d1b = targetData[fi + 2] - currentData[fi + 2]

      d2r = targetData[fi] - (color[0] * a + currentData[fi] * b)
      d2g = targetData[fi + 1] - (color[1] * a + currentData[fi + 1] * b)
      d2b = targetData[fi + 2] - (color[2] * a + currentData[fi + 2] * b)

      sum -= d1r * d1r + d1g * d1g + d1b * d1b
      sum += d2r * d2r + d2g * d2g + d2b * d2b
    }
  }

  return sum
}

exports.computeColorAndDifferenceChange = (offset, imageData, alpha) => {
  let rgb = computeColor(offset, imageData, alpha)
  let differenceChange = computeDifferenceChange(offset, imageData, rgb)

  let color = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`

  return { color, differenceChange }
}
