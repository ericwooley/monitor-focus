'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opencv = require('opencv');

var _opencv2 = _interopRequireDefault(_opencv);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EyeDetector = function () {
  _createClass(EyeDetector, null, [{
    key: 'convertToOneZeroArray',
    value: function convertToOneZeroArray(im) {
      var bwRepresentation = [];
      eachPixel(im, function (pixel) {
        bwRepresentation.push(checkBlack(pixel) ? 0 : 1);
      });
      return bwRepresentation;
    }
  }]);

  function EyeDetector() {
    _classCallCheck(this, EyeDetector);
  }

  _createClass(EyeDetector, [{
    key: 'initCamera',
    value: function initCamera() {
      this.camera = new _opencv2.default.VideoCapture(0);
    }
  }, {
    key: 'eyesFromImages',
    value: function eyesFromImages() {
      var _this = this;

      var imagePaths = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      var cb = arguments[1];

      console.log(imagePaths.length);
      if (!imagePaths.length) return;
      var imagePath = imagePaths.shift();
      console.log('loading', imagePath);
      _opencv2.default.readImage(imagePath, function (err, im) {
        if (err) throw err;
        detectEyes(im, function () {
          cb.apply(undefined, arguments);
          setTimeout(function () {
            _this.eyesFromImages(imagePaths, cb);
          }, 1000);
        });
      });
    }
  }, {
    key: 'shutDown',
    value: function shutDown() {
      this.camera.close();
      this.camera = null;
    }
  }, {
    key: 'getImageFromWebcam',
    value: function getImageFromWebcam(cb) {
      var _this2 = this;

      var cameraNumber = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

      this.initCamera();
      setTimeout(function () {
        _this2.camera.read(function (err, im) {
          if (err) {
            _this2.camera.close();
            console.error(err);
          } else {
            detectEyes(cb);
          }
        });
      }, 500);
    }
  }]);

  return EyeDetector;
}();

exports.default = EyeDetector;

function detectEyes(im, cb) {
  im.detectObject(_opencv2.default.EYE_CASCADE, {}, processEyes(im, cb));
}

function eachPixel(im, cb) {
  for (var col = 0; col < im.width(); col++) {
    for (var row = 0; row < im.height(); row++) {
      var pixel = im.pixel(row, col);
      cb(pixel, row, col);
    }
  }
}

function eachPixelHorizontal(im, cb) {
  for (var row = 0; row < im.height(); row++) {
    for (var col = 0; col < im.width(); col++) {
      var pixel = im.pixel(row, col);
      cb(pixel, row, col);
    }
  }
}

function averageImageBrightness(im) {
  var totalBrightness = 0;
  var numPixels = 0;
  eachPixel(im, function (pixel) {
    totalBrightness += getBrightness(pixel);
    numPixels++;
  });
  return totalBrightness / numPixels;
}

function getBrightness(_ref) {
  var _ref2 = _slicedToArray(_ref, 3);

  var r = _ref2[0];
  var g = _ref2[1];
  var b = _ref2[2];

  return (r + g + b) / 3;
}

function whiteOrBlackPixel(val, threshold) {
  return val > threshold ? 255 : 0;
}
function blackOrWhite(_ref3, threshold) {
  var _ref4 = _slicedToArray(_ref3, 3);

  var r = _ref4[0];
  var g = _ref4[1];
  var b = _ref4[2];

  var brightness = getBrightness([r, g, b]);
  var newColor = whiteOrBlackPixel(brightness, threshold);
  return [newColor, newColor, newColor];
}

function checkBlack(_ref5) {
  var _ref6 = _slicedToArray(_ref5, 3);

  var r = _ref6[0];
  var g = _ref6[1];
  var b = _ref6[2];

  return !r && !g && !b;
}

function colorsDifferTwice(arr) {
  var foundChange = false;
  var last = arr[0];
  for (var i = 1; i < arr.length; i++) {
    if (arr[i] !== last) {
      if (foundChange) return true;
      foundChange = true;
    }
  }
  return false;
}

var black = [0, 0, 0];
var white = [255, 255, 255];

function fillVerticalGaps(threshold, im) {
  var firstPixelIsBlack = checkBlack(im.pixel(0, 0));
  var buffer = [];
  for (var i = 0; i < threshold; i++) {
    buffer.push(firstPixelIsBlack);
  }
  eachPixel(im, function (pixel, row, col) {
    var pixelIsBlack = checkBlack(pixel);
    buffer.push(pixelIsBlack);
    buffer.shift();
    if (colorsDifferTwice(buffer)) {
      for (var i = 0; i < buffer.length; i++) {
        im.pixel(row - i, col, pixelIsBlack ? black : white);
      }
    }
  });
}

function fillHorizontalGaps(threshold, im) {
  var firstPixelIsBlack = checkBlack(im.pixel(0, 0));
  var buffer = [];
  for (var i = 0; i < threshold; i++) {
    buffer.push(firstPixelIsBlack);
  }
  eachPixelHorizontal(im, function (pixel, row, col) {
    var pixelIsBlack = checkBlack(pixel);
    buffer.push(pixelIsBlack);
    buffer.shift();
    if (colorsDifferTwice(buffer)) {
      for (var i = 0; i < buffer.length; i++) {
        im.pixel(row, col - i, pixelIsBlack ? black : white);
      }
    }
  });
}

function fillGaps(im) {
  var threshold = arguments.length <= 1 || arguments[1] === undefined ? 10 : arguments[1];

  fillVerticalGaps(threshold, im);
  fillHorizontalGaps(threshold, im);
  return im;
}

var green = [0, 255, 0];

function replaceWhite(im) {
  var color = arguments.length <= 1 || arguments[1] === undefined ? green : arguments[1];

  var brightness = averageImageBrightness(im);
  eachPixel(im, function (pixel, row, col) {
    var newColor = blackOrWhite(pixel, brightness);
    im.pixel(row, col, newColor);
  });
  return im;
}

function processEyes(im, cb) {
  return function (err, faces) {
    if (err) throw err;
    faces.map(function (_ref7, index) {
      var x = _ref7.x;
      var y = _ref7.y;
      var width = _ref7.width;
      var height = _ref7.height;

      console.log('procsessing');
      var original = im.clone().crop(x, y, width, height);
      var processed = replaceWhite(original.clone());
      processed = fillGaps(processed);

      // to debug
      // im.ellipse(x + width / 2, y + height / 2, width / 5, height / 5)
      cb({ original: original, processed: processed });
    });
  };
}
//# sourceMappingURL=get-eyes.js.map