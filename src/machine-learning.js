import fs from 'fs'
import EyeDetector from './eye-detector'
const centerScreenImages = fs.readdirSync('./test-data/center-screen')
  .map(imgName => './test-data/center-screen/' + imgName)
  .filter(imageName => imageName.indexOf('.DS_Store') === -1)
const eyeDetector = new EyeDetector()
let eyeCount = 0
// ['./test-data/center-screen/center-screen1.jpg']
eyeDetector.eyesFromImages(centerScreenImages, ({original, processed}) => {
  try {
    console.log({original, processed})
    console.log('saving', `./out/center-screen-${eyeCount}-original.jpg`)
    original.save(`./out/center-screen-${eyeCount}-original.jpg`)

    processed.save(`./out/center-screen-${eyeCount}-processed.jpg`)
  } catch (e) {
    console.error('image', eyeCount, 'could not be processed', e)
  }

  eyeCount++
})
