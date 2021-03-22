import * as http from 'http';
import GameRoom from './game-room';
import { RedisPresence, Server } from 'elsa';
const server = http.createServer();

const gameServer = new Server({ server });

gameServer.setPresence(new RedisPresence());
gameServer.registerHandler('classic', GameRoom, { map: 'map_1' });

gameServer.listen(8080);
