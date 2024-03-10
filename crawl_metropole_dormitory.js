const puppeteer = require('puppeteer');
const { google } = require('googleapis');
const fs = require('fs').promises;

// Google Sheets API 설정
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const CREDENTIALS_PATH = 'credentials.json'; // 서비스 계정의 키 파일

// Google Sheets API 인증 정보 가져오기
async function authorize() {
  const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH));
  const { client_email, private_key } = credentials;

  const auth = new google.auth.JWT({
    email: client_email,
    key: private_key,
    scopes: SCOPES,
  });

  return auth;
}

// Google Sheets에 데이터 쓰기
async function writeToGoogleSheets(auth, spreadsheetId, range, dates, breakfasts, dinners, origins) {
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const now = new Date();
    const timestamp = now.toLocaleString();

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range,
    });

    const values = dates.map((date, index) => [timestamp, date, breakfasts[index], dinners[index], origins[index]]);

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource: {
        values: values,
      },
    });

    console.log('Appended data to Google Sheets:', response.data);

    // 크롤링 데이터를 JSON 파일로 저장
    const jsonData = {
      timestamp,
      data: values.map(data => ({
        date: data[1],
        breakfast: data[2],
        dinner: data[3],
        origin: data[4],
      })),
    };
    await fs.writeFile('crawl_met_dorm.json', JSON.stringify(jsonData, null, 2));
    console.log('Crawling data saved to JSON file: crawledData.json');
  } catch (error) {
    console.error('Error appending data to Google Sheets:', error.message);
  }
}

// 크롤링 함수
async function scrapeWebsite() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://www.kduniv.ac.kr/kor/CMS/DietMenuMgr/list.do?mCode=MN183&searchDietCategory=5');
  await page.waitForSelector('#cafeteria-menu');

  const dates = await page.$$eval('#cafeteria-menu tbody tr th', (dates) => dates.map(date => {
    return date.textContent.trim().match(/월요일|화요일|수요일|목요일|금요일|토요일|일요일/g)[0];
  }));
  const breakfasts = await page.$$eval('#cafeteria-menu tbody tr td ul.res-depth1', (breakfasts) => breakfasts.map(breakfast => breakfast.textContent.trim()));
  const dinners = await page.$$eval('#cafeteria-menu tbody tr td ul.res-depth2', (dinners) => dinners.map(dinner => dinner.textContent.trim()));
  const origins = await page.$$eval('#cafeteria-menu tbody tr td ul.res-depth3', (origins) => origins.map(origin => origin.textContent.trim()));

  await browser.close();

  return { dates, breakfasts, dinners, origins };
}

// 메인 함수
async function main() {
  const auth = await authorize();
  const spreadsheetId = '1F3kEbduNvPnsIbfdO9gDZzc1yua1LMs627KAwZsYg6o';
  const range = '학식_메트로폴_기숙사!A2:N';
  const { dates, breakfasts, dinners, origins } = await scrapeWebsite();
  await writeToGoogleSheets(auth, spreadsheetId, range, dates, breakfasts, dinners, origins);
}

main();

















  /*const puppeteer = require('puppeteer');
const { google } = require('googleapis');
const fs = require('fs').promises;

// Google Sheets API 설정
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const CREDENTIALS_PATH = 'credentials.json'; // 서비스 계정의 키 파일

// Google Sheets API 인증 정보 가져오기
async function authorize() {
  const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH));
  const { client_email, private_key } = credentials;

  const auth = new google.auth.JWT({
    email: client_email,
    key: private_key,
    scopes: SCOPES,
  });

  return auth;
}

// Google Sheets에 데이터 쓰기
async function writeToGoogleSheets(auth,dates, breakfasts, dinners, origins) {
    const sheets = google.sheets({ version: 'v4', auth });
  
    try {
      const now = new Date();
      const timestamp = now.toLocaleString();

      await sheets.spreadsheets.values.clear({
            spreadsheetId: '1F3kEbduNvPnsIbfdO9gDZzc1yua1LMs627KAwZsYg6o',
            range: '학식_메트로폴_기숙사!A2:N',
      });

      const values = dates.map((date, index) => [timestamp, date, breakfasts[index], dinners[index], origins[index]]);
  
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: '1F3kEbduNvPnsIbfdO9gDZzc1yua1LMs627KAwZsYg6o',
        range: '학식_메트로폴_기숙사', // 원하는 시트 이름으로 변경
        valueInputOption: 'RAW',
        resource: {
          values: values,
        },
      });
  
      console.log('Appended data to Google Sheets:', response.data);
    } catch (error) {
      console.error('Error appending data to Google Sheets:', error.message);
    }
  }
  
  // 크롤링 함수
  async function scrapeWebsite() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
  
    await page.goto('https://www.kduniv.ac.kr/kor/CMS/DietMenuMgr/list.do?mCode=MN183&searchDietCategory=5');
    await page.waitForSelector('#cafeteria-menu');
  
    const dates = await page.$$eval('#cafeteria-menu tbody tr th', (dates) => dates.map(date => date.textContent.trim().replace(/\s+/g, ' ')));
    const breakfasts = await page.$$eval('#cafeteria-menu tbody tr td ul.res-depth1', (breakfasts) => breakfasts.map(breakfast => breakfast.textContent.trim()));
    const dinners = await page.$$eval('#cafeteria-menu tbody tr td ul.res-depth2', (dinners) => dinners.map(dinner => dinner.textContent.trim()));
    const origins = await page.$$eval('#cafeteria-menu tbody tr td ul.res-depth3', (origins) => origins.map(origin => origin.textContent.trim()));

    await browser.close();
  
    return { dates, breakfasts, dinners, origins };
  }
  
  // 메인 함수
  async function main() {
    const auth = await authorize();
    const { dates, breakfasts, dinners, origins } = await scrapeWebsite();
    await writeToGoogleSheets(auth, dates, breakfasts, dinners, origins);
  }
  
  main();

  async function getDomTodayMeal() {
    const auth = await authorize();
    const sheets = google.sheets({ version: 'v4', auth });
  
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: '1F3kEbduNvPnsIbfdO9gDZzc1yua1LMs627KAwZsYg6o',
        range: '학식_메트로폴_기숙사!A2:E',
      });
  
      const values = response.data.values;
      const dayOfWeek = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][new Date().getDay()];
  
      const todayRow = values.find((row) => {
        const rowDate = row[1];
  
        // rowDate에서 요일을 추출합니다.
        const rowDayOfWeekIndex = new Date(rowDate).getDay();
        const rowDayOfWeek = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][rowDayOfWeekIndex];
  
        return rowDayOfWeek.includes(dayOfWeek);
      });
  
      if (todayRow) {
        const [timestamp, date, breakfast, dinner, origin] = todayRow;
        const result = { timestamp, date, breakfast, dinner, origin };
        return result;
      } else {
        return { error: '오늘의 학식 데이터가 없습니다.' };
      }
    } catch (error) {
      console.error('Error retrieving data from Google Sheets:', error.message);
      return { error: 'Internal server error.' };
    }
  }
  
  async function getDomWeekMeal() {
    const auth = await authorize();
    const sheets = google.sheets({ version: 'v4', auth });
  
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: '1F3kEbduNvPnsIbfdO9gDZzc1yua1LMs627KAwZsYg6o',
        range: '학식_메트로폴_기숙사!A2:E',
      });
  
      const values = response.data.values;
      const weekData = {}; // 객체로 요일별 메뉴를 저장
  
      values.forEach((row) => {
        const [timestamp, date, breakfast, dinner, origin] = row;
  
        // rowDate에서 요일을 추출합니다.
        const rowDayOfWeekIndex = new Date(date).getDay();
        const rowDayOfWeek = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][rowDayOfWeekIndex];
  
        // 요일별로 메뉴를 저장
        if (!weekData[rowDayOfWeek]) {
          weekData[rowDayOfWeek] = [];
        }
  
        weekData[rowDayOfWeek].push({ timestamp, date, breakfast, dinner, origin });
      });
  
      return weekData;
    } catch (error) {
      console.error('Error retrieving data from Google Sheets:', error.message);
      return { error: 'Internal server error.' };
    }
  }

  module.exports = {
    getDomTodayMeal,
    getDomWeekMeal,
  };
   */