const Hapi = require('@hapi/hapi');
const path = require('path');


const tfNode = require('@tensorflow/tfjs-node');

const { createCanvas, loadImage } = require('canvas');
const streamToBuffer = require('stream/consumers').buffer;

let model;

const loadModel = async () => {
  const modelPath = path.resolve(__dirname, 'model/model.json');;
  model = await tfNode.loadLayersModel(`file://${modelPath.replace(/\\/g, '/')}`);
  console.log('model loaded from', modelPath);
};


const init = async () => {
  await loadModel();

  const server = Hapi.server({
    port: 5000,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['*'],
      },
      // payload: {
      //   maxBytes: 10485760,
      //   output: 'stream',
      //   parse: true,
      //   multipart: true,
      // },
    },
  });

  // server.route(
  // {
  //   method: 'GET',
  //   path: '/',
  //   options: {
  //     payload: {
  //       allow: 'multipart/form-data',
  //       multipart: true,
  //     },
  //   },
  //   handler: async (request, h) => {
  //     try {
  //       const { file } = request.payload;

  //       const buffer = await streamToBuffer(file);

  //       const img = await loadImage(buffer);
  //       const canvas = createCanvas(img.width, img.height);
  //       const ctx = canvas.getContext('2d');
  //       ctx.drawImage(img, 0, 0);

  //       const tfImage = tf.browser.fromPixels(canvas);
  //       const predictions = await model.classify(tfImage);

  //       return { predictions };
  //     } catch (error) {
  //       console.error('Prediction error:', error);
  //       return h.response({ error: 'Prediction failed.' }).code(500);
  //     }
  //   },
  // },
 
  // );

  server.route(
  {
    method: 'POST',
    path : '/predict',
    handler: async (request, h) => {
      try {
        const { input } = request.payload;
        const tensor = tfNode.tensor2d(input);
        const predictions = model.predict(tensor);
        const result = await predictions.array();
        return { prediction: result }
      } catch(err) {
        
        console.error('Prediction error:', err);
        return h.response({ error: err.message }).code(500);

      }
  },
  }
  )

  await server.start();
  console.log('Server running at:', server.info.uri);
};

init();
