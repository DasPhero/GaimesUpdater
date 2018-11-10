const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const axios = require('axios');
const convert = require('xml-js');
const cheerio = require('cheerio');


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('./../../../../phero/.credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Sheets API.
  axios.get('https://www.boardgamegeek.com/xmlapi/boardgame/133038?stats=1')
  .then(response => {
      //console.log(response.data);
      let jsonData = JSON.parse(convert.xml2json(response.data, {compact: true, spaces: 2, trim: true, ignoreDeclaration: true}));
      console.log(jsonData.boardgames.boardgame.statistics.ratings.average._text);
      fs.writeFile('bla.json', JSON.stringify(jsonData.boardgames.boardgame.statistics.ratings,0,2), (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
      });
  })
  .catch(error => {
    console.log(error);
  });
    let itemId = 889696002617;
    var statusCode = 0;
    var idealoPage;

    axios.get(`https://www.idealo.de/preisvergleich/Typ/${itemId}`)
    .then(response => {
    console.log("bibba", response.status);
    idealoPage = response.data;
    fs.writeFile('bla.html', response.data, (err) => {
                if (err) //console.log(err);
                console.log('The file has been saved!');
              });
        let $ = cheerio.load(idealoPage);
        let priceRange = $('.oopStage-priceRangePrice')[0].children[0].data
        let price = priceRange.slice(0, priceRange.indexOf("€") - 1);
        console.log(price);
    })
        .catch(error => {
        statusCode = error.response.status;
        console.log(statusCode);
        if(statusCode > 300){
            axios.get(`https://www.idealo.de/preisvergleich/OffersOfProduct/${itemId}`)
            .then(response => {
            console.log("bibba", response.status);
            idealoPage = response.data;
            fs.writeFile('bla.html', response.data, (err) => {
                        if (err) //console.log(err);
                        console.log('The file has been saved!');
                      });
            let $ = cheerio.load(idealoPage);
            console.log($);
            })
                .catch(error => {
                console.log(statusCode);
            });
        }    
        
    });
    
  //authorize(JSON.parse(content), listMajors);
});

//https://www.boardgamegeek.com/xmlapi/boardgame/133038?stats=1


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
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
      callback(oAuth2Client);
    });
  });
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
async function listMajors(auth) {
  const sheets = google.sheets({version: 'v4', auth});

  var rowCount;
  sheets.spreadsheets.values.get({
    spreadsheetId: '1kMyNw3JYanUGsYIKsXEC--mz049cACOdfjvEBcBQiQA',
    range: 'A:D',
  }, async (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    rowCount = rows.length;
    if (rows.length) {
      // Print columns A and E, which correspond to indices 0 and 4.
      rows.map((row) => {
        //console.log(`${row[0]},${row[1]},${row[2]},${row[3]}`);
      });
      rows.slice(1,-1).forEach((item, index) => {
          console.log("item", item, index)
      });
      //myLoop(rowCount, sheets);
      sortTable(auth, rowCount);
    } else {
        console.log('No data found.');
    }
});
}
https://www.boardgamegeek.com/xmlapi2/boardgame?id=238458&stats=1
function myLoop (rowCount, sheets) {           //  create a loop function
    setTimeout(function () {    //  call a 3s setTimeout when the loop is called
       
        var request = {
            // The ID of the spreadsheet to update.
            spreadsheetId: '1kMyNw3JYanUGsYIKsXEC--mz049cACOdfjvEBcBQiQA',  // TODO: Update placeholder value.
        
            // The A1 notation of the values to update.
            range: `H${rowCount}`,  // TODO: Update placeholder value.
        
            // How the input data should be interpreted.
            valueInputOption: 'RAW',  // TODO: Update placeholder value.
        
            resource: {
                values: [["Kekeke"]]
              // TODO: Add desired properties to the request body. All existing properties
              // will be replaced.
            }
          };
              sheets.spreadsheets.values.update(request, function(err, response) {
                if (err) {
                  console.error(err);
                  return;
                }
            
                // TODO: Change code below to process the `response` object:
                console.log("Done", response.status);
              });
       rowCount--;                     //  increment the counter
       if (rowCount > 1) {            //  if the counter < 10, call the loop function
          myLoop(rowCount, sheets);             //  ..  again which will trigger another 
       }                        //  ..  setTimeout()
    }, 1100)
 }

function sortTable(auth, rowCount){
    const sheets = google.sheets({version: 'v4', auth});

    var request = {
        spreadsheetId: "1kMyNw3JYanUGsYIKsXEC--mz049cACOdfjvEBcBQiQA",
        resource: {
            "requests": [
                {
                    "sortRange": {
                        "range": {
                            "sheetId": 0,
                            "startRowIndex": 1,
                            "endRowIndex": rowCount,
                            "startColumnIndex": 0,
                            "endColumnIndex": 9
                        },
                        "sortSpecs": [
                            {
                                "dimensionIndex": 3,
                                "sortOrder": "DESCENDING"
                            }
                        ]
                    }
                }
            ]
        },
        auth: auth
    }
    
    sheets.spreadsheets.batchUpdate(request, function(err, response){
        if (err) {
            console.error(err);
            return;
        }
        
        // TODO: Change code below to process the `response` object:
        console.log(response.status);
    })
}