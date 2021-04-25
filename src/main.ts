import * as http from 'http';
import GameRoom from './game-room';
import { RedisPresence, Server } from 'elsa';
import fastify from 'fastify';
import * as express from 'express';

const app = express();
/*
const secondsToDHMS = (seconds) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const dDisplay = d > 0 ? d + (d == 1 ? ' day' : ' days') : '';
  const hDisplay = h > 0 ? (dDisplay ? ', ' : '') + h + (h == 1 ? ' hour' : ' hours') : '';
  const mDisplay = m > 0 ? (hDisplay || dDisplay ? ', ' : '') + m + (m == 1 ? ' minute' : ' minutes') : '';
  const sDisplay = s > 0 ? (mDisplay || hDisplay || dDisplay ? ', ' : '') + s + (s == 1 ? ' second' : ' seconds') : '';
  return dDisplay + hDisplay + mDisplay + sDisplay;
};
const humanReadableNumber = (value, lang = null) => {
  if (!value) return;
  const locale = 'en';
  const number = parseFloat(value);
  return number.toLocaleString(locale);
};

let currentExp = 0;
let totalExp = 0;
let neededExp = 50;
let lvl = 1;
let text = '';

const expPerMin = 100 * 4 + 80 * 1;
let currentMin = 0;

while (lvl < 100) {
  currentMin++;
  totalExp += expPerMin;
  currentExp += expPerMin;

  while (currentExp >= neededExp) {
    text +=
      'Level ' +
      (lvl + 1) +
      ' needs ' +
      humanReadableNumber(neededExp) +
      'EXP, total EXP gained: ' +
      humanReadableNumber(totalExp) +
      ', if we were gathering 100 resources and killing 1 zombie every minute, we would need: ' +
      secondsToDHMS(currentMin * 60) +
      ' to get here.\n';
    lvl++;
    currentExp -= neededExp;
    neededExp = Math.round((neededExp + 120) * 1.1);
  }
}
console.log(text);*/

app.get('/user/login', (req, res) => {
  res.send('Hello World!');
});

const server = http.createServer(app);
const gameServer = new Server({ server, presence: new RedisPresence() });

gameServer.registerHandler('classic', GameRoom, { map: 'map_1' });
gameServer.listen(8080);
