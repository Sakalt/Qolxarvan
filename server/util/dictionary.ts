//

import {
  formatToTimeZone
} from "date-fns-timezone";
import fs from "fs";
import {
  nanoid
} from "nanoid";
import {
  Dictionary
} from "soxsot";
import {
  SingleLoader
} from "soxsot/dist/io";
import {
  GoogleUtils
} from "/server/util/google";
import {
  DICTIONARY_ID,
  HISTORY_SPREADSHEET_ID
} from "/server/variable";


export class DictionaryUtils {

  public static async fetch(): Promise<Dictionary> {
    let path = `./dist/temp/temp-${nanoid()}.xdn`;
    let stream = await GoogleUtils.downloadFile(DICTIONARY_ID);
    let fileStream = fs.createWriteStream(path, {encoding: "utf-8"});
    let promise = new Promise<Dictionary>((resolve, reject) => {
      stream.on("data", (chunk) => {
        fileStream.write(chunk);
      });
      stream.on("end", async () => {
        fileStream.end();
        let loader = new SingleLoader(path);
        let dictionary = await loader.asPromise();
        await fs.promises.unlink(path);
        resolve(dictionary);
      });
      stream.on("error", (error) => {
        console.error(error);
        reject(error);
      });
    });
    let dictionary = await promise;
    return dictionary;
  }

  // 現在の単語数を Google スプレッドシートに保存します。
  // 日付は 30 時間制のもの (0 時から 6 時までは通常の日付の前日になる) を利用します。
  public static async saveHistory(): Promise<void> {
    let [spreadsheet, dictionary] = await Promise.all([GoogleUtils.fetchSpreadsheet(HISTORY_SPREADSHEET_ID), DictionaryUtils.fetch()]);
    let sheet = spreadsheet.sheetsByIndex[0];
    let rawDate = new Date(new Date().getTime() - 6 * 60 * 60 * 1000);
    let rawUnsiftedDate = new Date();
    let date = formatToTimeZone(rawDate, "YYYY/MM/DD", {timeZone: "Asia/Tokyo"});
    let time = formatToTimeZone(rawUnsiftedDate, "YYYY/MM/DD HH:mm:ss", {timeZone: "Asia/Tokyo"});
    let count = dictionary.words.length;
    await sheet.addRow({date, time, count});
  }

  public static async fetchWordCountDifference(duration: number): Promise<number | null> {
    let [spreadsheet, dictionary] = await Promise.all([GoogleUtils.fetchSpreadsheet(HISTORY_SPREADSHEET_ID), DictionaryUtils.fetch()]);
    let sheet = spreadsheet.sheetsByIndex[0];
    let rows = await sheet.getRows();
    let rawTargetDate = new Date(new Date().getTime() - duration * 24 * 60 * 60 * 1000 - 6 * 60 * 60 * 1000);
    let targetDate = formatToTimeZone(rawTargetDate, "YYYY/MM/DD", {timeZone: "Asia/Tokyo"});
    let targetCount = rows.find((row) => row.date === targetDate)?.count;
    if (targetCount !== undefined) {
      let difference = dictionary.words.length - targetCount;
      return difference;
    } else {
      return null;
    }
  }

}