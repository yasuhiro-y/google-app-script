function main() {
  // Place API
  const API_KEY: string = ''
  // Spreadsheet ID
  const SPREADSHEET_ID: string = ''

  const spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet = SpreadsheetApp.openById(
    SPREADSHEET_ID
  )
  const sheet: GoogleAppsScript.Spreadsheet.Sheet = spreadsheet.getSheets()[0]

  writeResults(sheet, API_KEY)
}

const writeResults = (
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  API_KEY: string
) => {
  const lastRow: number = sheet.getLastRow()

  // 行ごとの処理
  for (let i: number = 2; i <= lastRow; i++) {
    const queryKeyword: string = getKeyword(sheet, i)
    Logger.log(queryKeyword)

    const locationId: string = getLocationId(queryKeyword, API_KEY)
    if (locationId !== 'FAIL') {
      const details = getDetails(locationId, API_KEY)

      const ranges: GoogleAppsScript.Spreadsheet.Range = sheet.getRange(
        'c' + i + ':k' + i
      )

      Logger.log(String(i), 3, String(i), details.length + 2)
      ranges.setValues([details])
    } else {
      sheet.getRange(i, 3).setValue('No Result')
    }
  }
}

const getKeyword = (sheet: GoogleAppsScript.Spreadsheet.Sheet, row: number) => {
  const keyword: string = sheet.getRange(row, 1).getValue()
  const additionalKeyword: string = sheet.getRange(row, 2).getValue()
  let queryKeyword: string = keyword + '+' + additionalKeyword
  queryKeyword = queryKeyword.replace('　', '+')
  return queryKeyword
}

const getLocationId = (queryKeyword: string, API_KEY: string) => {
  const baseUrl =
    'https://maps.googleapis.com/maps/api/place/findplacefromtext/json'
  const queryUrl =
    baseUrl + '?input=' + queryKeyword + '&inputtype=textquery&key=' + API_KEY
  Logger.log(queryUrl)

  const options = {
    muteHttpExceptions: true, //エラー捕捉
    validateHttpsCertificates: false, //証明書エラー回避
    followRedirects: false, //リダイレクト先捕捉
  }

  const response = UrlFetchApp.fetch(queryUrl)
  const json = response.getContentText()
  const placeId = JSON.parse(json)
  Logger.log(placeId)
  // 一番上の結果のIDを返す
  if (placeId.status != 'OK') {
    return 'FAIL'
  }
  return placeId.candidates[0].place_id
}

const getDetails = (id: string, API_KEY: string) => {
  const fields = 'name,rating,formatted_phone_number,formatted_address,photo'
  const baseUrl =
    'https://maps.googleapis.com/maps/api/place/details/json?placeid='
  const queryUrl =
    baseUrl +
    id +
    '&fields=' +
    fields +
    '&language=ja' +
    '&region=' +
    '&key=' +
    API_KEY

  const response = UrlFetchApp.fetch(queryUrl)
  const json = response.getContentText()
  const place = JSON.parse(json).result

  Logger.log(json)

  const details = [
    place.name,
    place.formatted_address,
    place.formatted_phone_number,
    place.id,
    place.place_id,
    place.rating,
    place.url,
    place.website,
    place.permanently_closed,
  ]

  return details
}
