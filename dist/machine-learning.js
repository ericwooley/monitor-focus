'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _getEyes = require('./get-eyes');

var _getEyes2 = _interopRequireDefault(_getEyes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var centerScreenImages = _fs2.default.readdirSync('./test-data/center-screen').map(function (imgName) {
  return './test-data/center-screen/' + imgName;
}).filter(function (imageName) {
  return imageName.indexOf('.DS_Store') === -1;
});
var eyeDetector = new _getEyes2.default();
var eyeCount = 0;
// ['./test-data/center-screen/center-screen1.jpg']
eyeDetector.eyesFromImages(centerScreenImages, function (_ref) {
  var original = _ref.original;
  var processed = _ref.processed;

  try {
    console.log({ original: original, processed: processed });
    console.log('saving', './out/center-screen-' + eyeCount + '-original.jpg');
    original.save('./out/center-screen-' + eyeCount + '-original.jpg');

    processed.save('./out/center-screen-' + eyeCount + '-processed.jpg');
  } catch (e) {
    console.error('image', eyeCount, 'could not be processed', e);
  }

  eyeCount++;
});
//# sourceMappingURL=machine-learning.js.map