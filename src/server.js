const Hapi = require('@hapi/hapi');
const path = require('path');


const tfNode = require('@tensorflow/tfjs-node');

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
    host: process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'],
      },
     
    },
  });

  server.route([
  {
    method: 'GET',
    path: '/',
    handler: async () => {
      return 'Hello, use post /predict to get the api response'
    }
  },
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
  }]
  )

  await server.start();
  console.log('Server running at:', server.info.uri);
};

init();
