import * as http from 'http';
import GameRoom from './game-room';
import { RedisPresence, Server } from 'elsa';
import fastify from 'fastify';
import * as express from 'express';

const app = express();

app.get('/user/login', (req, res) => {
  res.send('Hello World!');
});

const server = http.createServer(app);
const gameServer = new Server({ server, presence: new RedisPresence() });

gameServer.registerHandler('classic', GameRoom, { map: 'map_1' });
gameServer.listen(8080);
