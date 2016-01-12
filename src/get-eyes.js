import cv from 'opencv'

export default class EyeDetector {
  static convertToOneZeroArray (im) {
    const bwRepresentation = []
    eachPixel(im, (pixel) => {
      bwRepresentation.push(checkBlack(pixel) ? 0 : 1)
    })
    return bwRepresentation
  }
  constructor () {
  }
  initCamera () {
    this.camera = new cv.VideoCapture(0)
  }

  eyesFromImages (imagePaths = [], cb) {
    console.log(imagePaths.length)
    if (!imagePaths.length) return
    const imagePath = imagePaths.shift()
    console.log('loading', imagePath)
    cv.readImage(imagePath, (err, im) => {
      if (err) throw err
      detectEyes(im, (...args) => {
        cb(...args)
        setTimeout(() => {
          this.eyesFromImages(imagePaths, cb)
        }, 1000)
      })
    })
  }

  shutDown () {
    this.camera.close()
    this.camera = null
  }
  getImageFromWebcam (cb, cameraNumber = 0) {
    this.initCamera()
    setTimeout(() => {
      this.camera.read((err, im) => {
        if (err) {
          this.camera.close()
          console.error(err)
        } else {
          detectEyes(cb)
        }
      })
    }, 500)
  }
}

function detectEyes (im, cb) {
  im.detectObject(cv.EYE_CASCADE, {}, processEyes(im, cb))
}

function eachPixel (im, cb) {
  for (let col = 0; col < im.width(); col++) {
    for (let row = 0; row < im.height(); row++) {
      const pixel = im.pixel(row, col)
      cb(pixel, row, col)
    }
  }
}

function eachPixelHorizontal (im, cb) {
  for (let row = 0; row < im.height(); row++) {
    for (let col = 0; col < im.width(); col++) {
      const pixel = im.pixel(row, col)
      cb(pixel, row, col)
    }
  }
}

function averageImageBrightness (im) {
  let totalBrightness = 0
  let numPixels = 0
  eachPixel(im, (pixel) => {
    totalBrightness += getBrightness(pixel)
    numPixels++
  })
  return totalBrightness / numPixels
}

function getBrightness ([r, g, b]) {
  return (r + g + b) / 3
}

function whiteOrBlackPixel (val, threshold) {
  return val > threshold ? 255 : 0
}
function blackOrWhite ([r, g, b], threshold) {
  const brightness = getBrightness([r, g, b])
  const newColor = whiteOrBlackPixel(brightness, threshold)
  return [newColor, newColor, newColor]
}

function checkBlack ([r, g, b]) {
  return !r && !g && !b
}

function colorsDifferTwice (arr) {
  let foundChange = false
  let last = arr[0]
  for (var i = 1; i < arr.length; i++) {
    if (arr[i] !== last) {
      if (foundChange) return true
      foundChange = true
    }
  }
  return false
}

const black = [0, 0, 0]
const white = [255, 255, 255]

function fillVerticalGaps (threshold, im) {
  const firstPixelIsBlack = checkBlack(im.pixel(0, 0))
  const buffer = []
  for (var i = 0; i < threshold; i++) {
    buffer.push(firstPixelIsBlack)
  }
  eachPixel(im, (pixel, row, col) => {
    const pixelIsBlack = checkBlack(pixel)
    buffer.push(pixelIsBlack)
    buffer.shift()
    if (colorsDifferTwice(buffer)) {
      for (var i = 0; i < buffer.length; i++) {
        im.pixel(row - i, col, pixelIsBlack ? black : white)
      }
    }
  })
}

function fillHorizontalGaps (threshold, im) {
  const firstPixelIsBlack = checkBlack(im.pixel(0, 0))
  const buffer = []
  for (var i = 0; i < threshold; i++) {
    buffer.push(firstPixelIsBlack)
  }
  eachPixelHorizontal(im, (pixel, row, col) => {
    const pixelIsBlack = checkBlack(pixel)
    buffer.push(pixelIsBlack)
    buffer.shift()
    if (colorsDifferTwice(buffer)) {
      for (var i = 0; i < buffer.length; i++) {
        im.pixel(row, col - i, pixelIsBlack ? black : white)
      }
    }
  })
}

function fillGaps (im, threshold = 10) {
  fillVerticalGaps(threshold, im)
  fillHorizontalGaps(threshold, im)
  return im
}

const green = [0, 255, 0]

function replaceWhite (im, color = green) {
  const brightness = averageImageBrightness(im)
  eachPixel(im, (pixel, row, col) => {
    const newColor = blackOrWhite(pixel, brightness)
    im.pixel(row, col, newColor)
  })
  return im
}

function processEyes (im, cb) {
  return (err, faces) => {
    if (err) throw err
    faces.map(({x, y, width, height}, index) => {
      console.log('procsessing')
      let original = im.clone().crop(x, y, width, height)
      let processed = replaceWhite(original.clone())
      processed = fillGaps(processed)

      // to debug
      // im.ellipse(x + width / 2, y + height / 2, width / 5, height / 5)
      cb({original, processed})
    })
  }
}
