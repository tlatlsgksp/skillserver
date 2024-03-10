const express = require('express');
const fs = require('fs');
const schedule = require('node-schedule');
const crawlingMealMetropole = require('./crawl_metropole');
const crawlingMealMetropoleDormitory = require('./crawl_metropole_dormitory');

const app = express();
const port = 8080;
const browser = puppeteer.launch({
	args: ['--no-sandbox', '--disable-setuid-sandbox']
});
//app.use(express.static(__dirname));

var mealMetropole;
var mealMetropoleDormitory;

fs.readFile('./crawl_met.json', 'utf8', (err, data) => {
  if (err) throw err;
  mealMetropole = JSON.parse(data);
});
fs.readFile('./crawl_met_dorm.json', 'utf8', (err, data) => {
  if (err) throw err;
  mealMetropoleDormitory = JSON.parse(data);
});

async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading JSON file:', error.message);
    return null;
  }
}

function createMealCard(title, description, buttons) {
  return {
    'textCard': {
      'title': title,
      'description': description,
      'buttons': buttons
    }
  };
}

const mondaySchedule = schedule.scheduleJob({ dayOfWeek: 1, hour: 6, minute: 0 }, async function() {
  console.log('크롤링 스크립트 실행 중...');
  await crawlingMealMetropole();
  await crawlingMealMetropoleDormitory();
  mealMetropole = await readJsonFile('crawl_met.json');
  mealMetropoleDormitory = await readJsonFile('crawl_met_dorm.json');
});

app.get('/', (req, res) => {
  res.send('서버가 실행 중입니다.');
});
app.get('/keyboard', (req, res) => {
  const data = { 'type': 'text' }
  res.json(data);
});

app.use(express.json());

app.post('/today', async (req, res) => {
  const day = new Date();
  const today = day.getDay();
  var todayMealMetropole
  var todayMealMetropoleDormitory
  var targetDay;

  switch (today) {
    case 0: // 일요일
      targetDay = '일요일';
      break;
    case 1: // 월요일
      targetDay = '월요일';
      break;
    case 2: // 화요일
      targetDay = '화요일';
      break;
    case 3: // 수요일
      targetDay = '수요일';
      break;
    case 4: // 목요일
      targetDay = '목요일';
      break;
    case 5: // 금요일
      targetDay = '금요일';
      break;
    case 6: // 토요일
      targetDay = '토요일';
      break;
    default:
      console.error('올바르지 않은 요일 값입니다.');
  }
    todayMealMetropole = mealMetropole.data.find(item => item.date === targetDay);
    todayMealMetropoleDormitory = mealMetropoleDormitory.data.find(item => item.date === targetDay);
    const response = {
      'version': '2.0',
      'template': {
        'outputs': [
          createMealCard(`오늘의 학식 [${todayMealMetropole.date}] 양주 캠퍼스`, `한정식: ${todayMealMetropole.meal}`, [
            {
              'action': 'message',
              'label': '원산지 확인',
              'messageText': `원산지: ${todayMealMetropole.origin}`
            },
            {
              'action': 'message',
              'label': '처음으로',
              'messageText': '처음으로'
            },
            {
              'action': 'message',
              'label': '뒤로가기',
              'messageText': '뒤로가기'
            }
          ]),
          createMealCard(`오늘의 학식[${todayMealMetropoleDormitory.date}] 양주 캠퍼스 기숙사`, `조식: ${todayMealMetropoleDormitory.breakfast}\n석식: ${todayMealMetropoleDormitory.dinner}`, [
            {
              'action': 'message',
              'label': '원산지 확인',
              'messageText': `원산지[조식]: ${todayMealMetropoleDormitory.breakfast_origin}\n원산지[석식]: ${todayMealMetropoleDormitory.dinner_origin}`
            },
            {
              'action': 'message',
              'label': '처음으로',
              'messageText': '처음으로'
            },
            {
              'action': 'message',
              'label': '뒤로가기',
              'messageText': '뒤로가기'
            }
          ])
        ]
      }
    };

    res.json(response);
});

app.post('/week', async (req, res) => {


});

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

