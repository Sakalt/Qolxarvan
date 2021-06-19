//

import {
  formatToTimeZone
} from "date-fns-timezone";
import {
  MessageEmbed
} from "discord.js";
import fs from "fs";
import {
  nanoid
} from "nanoid";
import {
  Dictionary,
  Parser
} from "soxsot";
import {
  SingleLoader
} from "soxsot/dist/io";
import {
  GoogleClient
} from "/server/util/google";
import {
  DICTIONARY_ID,
  HISTORY_SPREADSHEET_ID
} from "/server/variable";


export class DictionaryUtils {

  public static async fetch(): Promise<Dictionary> {
    let path = `./dist/temp/temp-${nanoid()}.xdn`;
    let stream = await GoogleClient.instance.downloadFile(DICTIONARY_ID);
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
    let [spreadsheet, dictionary] = await Promise.all([GoogleClient.instance.fetchSpreadsheet(HISTORY_SPREADSHEET_ID), DictionaryUtils.fetch()]);
    let sheet = spreadsheet.sheetsByIndex[0];
    let rawDate = new Date(new Date().getTime() - 6 * 60 * 60 * 1000);
    let rawUnsiftedDate = new Date();
    let date = formatToTimeZone(rawDate, "YYYY/MM/DD", {timeZone: "Asia/Tokyo"});
    let time = formatToTimeZone(rawUnsiftedDate, "YYYY/MM/DD HH:mm:ss", {timeZone: "Asia/Tokyo"});
    let count = dictionary.words.length;
    await sheet.addRow({date, time, count});
  }

  public static async fetchWordCountDifference(duration: number): Promise<number | null> {
    let [spreadsheet, dictionary] = await Promise.all([GoogleClient.instance.fetchSpreadsheet(HISTORY_SPREADSHEET_ID), DictionaryUtils.fetch()]);
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

  public static async fetchTwitterText(): Promise<string> {
    let dictionary = await DictionaryUtils.fetch();
    let word = Parser.createSimple().parse(dictionary.words[Math.floor(Math.random() * dictionary.words.length)]);
    let section = word.parts["ja"]?.sections[0];
    if (section !== undefined) {
      let text = "";
      text += word.name;
      text += ` /${word.pronunciation}/ `;
      let equivalentStrings = section.getEquivalents(true).map((equivalent) => {
        let equivalentCategoryString = `〈${equivalent.category}〉`;
        let equivalentFrameString = (equivalent.frame !== null && equivalent.frame !== "") ? `(${equivalent.frame}) ` : "";
        let equivalentNameString = equivalent.names.join(", ");
        let equivalentString = equivalentCategoryString + equivalentFrameString + equivalentNameString;
        return equivalentString;
      });
      text += equivalentStrings?.join(" ") ?? "";
      let meaningInformation = section.getNormalInformations(true).find((information) => information.kind === "meaning");
      if (meaningInformation !== undefined) {
        let meaningText = meaningInformation.text;
        if (meaningText !== "?") {
          text += ` ❖ ${meaningText}`;
        }
      }
      text += " ";
      text += `https://dic.ziphil.com?search=${encodeURIComponent(word.name)}&mode=name&type=exact`;
      return text;
    } else {
      return "";
    }
  }

  public static async fetchDiscordEmbed(name?: string): Promise<MessageEmbed | undefined> {
    let dictionary = await DictionaryUtils.fetch();
    let rawWord = (name !== undefined) ? dictionary.words.find((word) => word.name === name) : dictionary.words[Math.floor(Math.random() * dictionary.words.length)];
    if (rawWord !== undefined) {
      let word = Parser.createSimple().parse(rawWord);
      let section = word.parts["ja"]?.sections[0];
      if (section !== undefined) {
        let embed = new MessageEmbed();
        embed.title = word.name;
        embed.url = `https://dic.ziphil.com?search=${encodeURIComponent(word.name)}&mode=name&type=exact`;
        embed.color = 0xFFAB33;
        let equivalentStrings = section.getEquivalents(true).map((equivalent) => {
          let equivalentString = "";
          equivalentString += `**❬${equivalent.category}❭** `;
          if (equivalent.frame) {
            equivalentString += `(${equivalent.frame}) `;
          }
          equivalentString += equivalent.names.join(", ");
          return equivalentString;
        });
        embed.description = equivalentStrings.join("\n");
        embed.addField("品詞", `❬${section.sort}❭`, true);
        embed.addField("発音", `/${word.pronunciation}/`, true);
        embed.addField("造語日", `ᴴ${word.date}`, true);
        let normalInformationFields = section.getNormalInformations(true).map((information) => {
          let normalInformationField = {name: information.getKindName("ja")!, value: information.text, inline: false};
          return normalInformationField;
        });
        let phraseInformationFields = section.getPhraseInformations(true).map((information) => {
          let phraseInformationText = "";
          phraseInformationText += information.expression;
          phraseInformationText += ` — ${information.equivalentNames.join(", ")}`;
          if (information.text) {
            phraseInformationText += `\n${information.text}`;
          }
          let phraseInformationField = {name: information.getKindName("ja")!, value: phraseInformationText, inline: false};
          return phraseInformationField;
        });
        let exampleInformationFields = section.getExampleInformations(true).map((information) => {
          let exampleInformationText = "";
          exampleInformationText += information.sentence;
          exampleInformationText += ` → ${information.translation}`;
          let phraseInformationField = {name: information.getKindName("ja")!, value: exampleInformationText, inline: false};
          return phraseInformationField;
        });
        embed.addFields(...normalInformationFields, ...phraseInformationFields, ...exampleInformationFields);
        return embed;
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }

}