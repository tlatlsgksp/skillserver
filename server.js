const express = require('express');
const schedule = require('node-schedule');
const crawlingMealMetropole = require('./crawling_meal_metropole');
const crawlingMealMetropoleDormitory = require('./crawling_meal_metropole_dormitory');

const app = express();
const port = 3000;

const mondaySchedule = schedule.scheduleJob({ dayOfWeek: 1, hour: 6, minute: 0 }, function() {
  console.log('크롤링 스크립트 실행 중...');
  crawlingMealMetropole();
  crawlingMealMetropoleDormitory();
});

app.get('/', (req, res) => {
  res.send('서버가 실행 중입니다.');
});

app.use(express.json());

app.post('/metropole_meal_today', (req, res) => {

  const dummyData = {
    date: '2024-03-09',
    menu: '백미밥, 미역국, 소세지야채볶음, 진미채볶음, 세발나물겉절이, 배추김치',
    origin: '쌀-국내산, 돼지고기-미국산, 콩-미국, 배추김치-국내산',
  };

  res.json(dummyData);
});

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});