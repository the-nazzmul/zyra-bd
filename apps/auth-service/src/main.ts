import { ErrorMiddleware } from '@zyra-bd/error-handler';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import authRouter from './routes/auth.router';
import swaggerUi from 'swagger-ui-express';
const swaggerDocument = require('./swagger-output.json');

const port = process.env.PORT || 8000;

const app = express();

// Middleware
app.use(
  cors({
    origin: ['http://localhost:3000'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/docs-json', (req, res) => {
  res.json(swaggerDocument);
});

// Routes

app.use('/api/v1', authRouter);

app.use(ErrorMiddleware);

const server = app.listen(port, () => {
  console.log(`[ ready ] http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/docs-json`);
});

server.on('error', (error) => {
  console.log(`Server error: ${error}`);
});
