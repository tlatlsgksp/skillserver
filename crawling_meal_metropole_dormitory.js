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
async function writeToGoogleSheets(auth,dates, breakefasts, dinners, origins) {
    const sheets = google.sheets({ version: 'v4', auth });
  
    try {
      const now = new Date();
      const timestamp = now.toLocaleString();

      await sheets.spreadsheets.values.clear({
            spreadsheetId: '1F3kEbduNvPnsIbfdO9gDZzc1yua1LMs627KAwZsYg6o',
            range: '학식_메트로폴_기숙사!A2:N',
      });

      const values = dates.map((date, index) => [timestamp, date, breakefasts[index], dinners[index], origins[index]]);
  
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
    const breakefasts = await page.$$eval('#cafeteria-menu tbody tr td ul.res-depth1', (breakefasts) => breakefasts.map(breakefast => breakefast.textContent.trim()));
    const dinners = await page.$$eval('#cafeteria-menu tbody tr td ul.res-depth2', (dinners) => dinners.map(dinner => dinner.textContent.trim()));
    const origins = await page.$$eval('#cafeteria-menu tbody tr td ul.res-depth3', (origins) => origins.map(origin => origin.textContent.trim()));

    await browser.close();
  
    return { dates, breakefasts, dinners, origins };
  }
  
  // 메인 함수
  async function main() {
    const auth = await authorize();
    const { dates, breakefasts, dinners, origins } = await scrapeWebsite();
    await writeToGoogleSheets(auth, dates, breakefasts, dinners, origins);
  }
  
  main();