import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Auth Service API',
    description:
      'Automatically generated API documentation for the Auth Service',
    version: '1.0.0',
  },
  host: 'localhost:8000',
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endPointsFiles = ['./routes/auth.router.ts'];

swaggerAutogen()(outputFile, endPointsFiles, doc);
