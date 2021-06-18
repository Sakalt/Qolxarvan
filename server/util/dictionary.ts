//

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

  public static async saveHistory(): Promise<void> {
    let [spreadsheet, dictionary] = await Promise.all([GoogleUtils.fetchSpreadsheet(HISTORY_SPREADSHEET_ID), DictionaryUtils.fetch()]);
    let sheet = spreadsheet.sheetsByIndex[0];
    let rawDate = new Date();
    let date = ("0000" + rawDate.getFullYear()).slice(-4) + "/" + ("00" + (rawDate.getMonth() + 1)).slice(-2) + "/" + ("00" + rawDate.getDate()).slice(-2);
    let count = dictionary.words.length;
    await sheet.addRow({date, count});
  }

  public static async fetchWordCountDifference(duration: number): Promise<number | null> {
    let [spreadsheet, dictionary] = await Promise.all([GoogleUtils.fetchSpreadsheet(HISTORY_SPREADSHEET_ID), DictionaryUtils.fetch()]);
    let sheet = spreadsheet.sheetsByIndex[0];
    let rows = await sheet.getRows();
    let rawTargetDate = new Date(new Date().getTime() - duration * 24 * 60 * 60 * 1000);
    let targetDate = ("0000" + rawTargetDate.getFullYear()).slice(-4) + "/" + ("00" + (rawTargetDate.getMonth() + 1)).slice(-2) + "/" + ("00" + rawTargetDate.getDate()).slice(-2);
    let targetCount = rows.find((row) => row.date === targetDate)?.count;
    if (targetCount !== undefined) {
      let difference = dictionary.words.length - targetCount;
      return difference;
    } else {
      return null;
    }
  }

}