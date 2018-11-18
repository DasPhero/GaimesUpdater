const fs = require('fs');
const readline = require('readline');
const {
    google
} = require('googleapis');
const axios = require('axios');
const convert = require('xml-js');
const cheerio = require('cheerio');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';

var credentials;
var oAuth2Client;
var sheetRows;
var sheetData = [];

function updateGames() {
    getCredentials().then(() => {
        return authorize(getCurrentSheet);
    }).then(() => {
        console.log(sheetRows)
        sheetRows.forEach((row, index) => {
            sheetData.push({
                index: index + 2,
                originalPrice: row[0],
                bgg: row[5],
                ba: row[6]
            })
        });
    }).then(() => {
        let bggCalls = 0;
        return new Promise(async (prom) => {
            await sheetData.map(async (row, index) => {
                await new Promise((resolve) => {
                    getGameScore(row.bgg, resolve)
                }).then((score) => {
                    sheetData[row.index - 2].bgg = score
                });
                await new Promise((resolve) => { 
                    getGamePrice(row.ba, resolve) 
                }).then((price) => { 
                    if(price != "0"){
                        sheetData[row.index - 2].ba = price
                    }
                    else{
                        sheetData[row.index - 2].ba = sheetData[row.index - 2].originalPrice.slice(0, sheetData[row.index - 2].originalPrice.indexOf("€") - 1);
                        console.log(sheetData[row.index - 2])
                    }
                });
                bggCalls++;
                if (bggCalls === sheetData.length) {
                    prom();
                }
            })
        })
    }).then(() => {
        let scoreArray = sheetData.map(row => {
            return [row.ba, row.bgg.replace(".", ",")];
        })
        return authorize(writeScoreToTable, scoreArray);
    })
    .then(() => {
        authorize(sortTable);
    });
}

function getCredentials() {
    return new Promise((resolve, reject) => {
        fs.readFile('./../../../../phero/.credentials.json', (err, creds) => {
            if (err) return console.log('Error loading client secret file:', err);
            credentials = JSON.parse(creds);
            resolve();
        });
    })
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(callback, params) {
    return new Promise((resolve, reject) => {
        const {
            client_secret,
            client_id,
            redirect_uris
        } = credentials.installed;
        oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);
        //Check for stores token
        fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) return getNewToken(oAuth2Client);
            oAuth2Client.setCredentials(JSON.parse(token));
            sheets = google.sheets({
                version: 'v4',
                oAuth2Client
            });
            return callback(oAuth2Client, params, resolve);
        });
    })
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken() {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error while trying to retrieve access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
        });
    });
}

function getCurrentSheet(auth, params, resolve) {
    let sheets = google.sheets({
        version: 'v4',
        auth
    });
    let options = {
        spreadsheetId: '1kMyNw3JYanUGsYIKsXEC--mz049cACOdfjvEBcBQiQA',
        range: 'B:H',
    }

    sheets.spreadsheets.values.get(options, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        sheetRows = res.data.values;
        sheetRows = sheetRows.slice(1);
        if (!sheetRows.length) {
            console.log('No data found.');
        }
        resolve();
    });
}

function getGameScore(bggId, resolve) {
    axios.get(`https://www.boardgamegeek.com/xmlapi/boardgame/${bggId}?stats=1`)
        .then(response => {
            let jsonData = JSON.parse(convert.xml2json(response.data, {
                compact: true,
                spaces: 2,
                trim: true,
                ignoreDeclaration: true
            }));
            let score = jsonData.boardgames.boardgame.statistics.ratings.average._text;
            resolve(score);
        })
        .catch(error => {
            console.log(error);
            resolve(undefined);
        });
}

function getGamePrice(itemId, resolve) {
    axios.get(`https://www.brettspiel-angebote.de/widget/?gameId=${itemId}`)
        .then(response => {
            bAPage = response.data;
            resolve(extractPrice(bAPage))
        })
    }

function extractPrice(pageData) {
    let $ = cheerio.load(pageData);
    let bestPrice = "0";
    try{
        bestPrice = $('.price')[0].children[0].data;
    }
    catch(err){
        return bestPrice;
    }
    return bestPrice.slice(0, bestPrice.indexOf("€") - 1)
}

function writeScoreToTable(auth, scoreData, resolve) {
    const sheets = google.sheets({
        version: 'v4',
        auth
    });

    var request = {
        spreadsheetId: '1kMyNw3JYanUGsYIKsXEC--mz049cACOdfjvEBcBQiQA',
        range: `B2`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: scoreData
        }
    };
    sheets.spreadsheets.values.update(request, function (err, response) {
        if (err) {
            console.error(err);
            return;
        }
        resolve();
    });
}

function writePriceToTable(auth, priceData, resolve) {
    const sheets = google.sheets({
        version: 'v4',
        auth
    });

    var request = {
        spreadsheetId: '1kMyNw3JYanUGsYIKsXEC--mz049cACOdfjvEBcBQiQA',
        range: `B2`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: priceData
        }
    };
    sheets.spreadsheets.values.update(request, function (err, response) {
        if (err) {
            console.error(err);
            return;
        }
        resolve();
    });
}

function sortTable(auth, resolve) {
    const sheets = google.sheets({
        version: 'v4',
        auth
    });
    var request = {
        spreadsheetId: "1kMyNw3JYanUGsYIKsXEC--mz049cACOdfjvEBcBQiQA",
        resource: {
            "requests": [{
                "sortRange": {
                    "range": {
                        "sheetId": 0,
                        "startRowIndex": 1,
                        "endRowIndex": sheetData.length + 1,
                        "startColumnIndex": 0,
                        "endColumnIndex": 9
                    },
                    "sortSpecs": [{
                        "dimensionIndex": 3,
                        "sortOrder": "DESCENDING"
                    }]
                }
            }]
        },
        auth: auth
    }

    sheets.spreadsheets.batchUpdate(request, function (err, response) {
        if (err) {
            console.error(err);
            return;
        }
        console.log(response.status);
    })
}

updateGames();