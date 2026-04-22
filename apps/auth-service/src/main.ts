import express from 'express';
import cors from 'cors';

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

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

const server = app.listen(port, () => {
  console.log(`[ ready ] http://localhost:${port}`);
});

server.on('error', (error) => {
  console.log(`Server error: ${error}`);
});
