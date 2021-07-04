//

import {
  formatToTimeZone
} from "date-fns-timezone";
import {
  MessageActionRow,
  MessageButton,
  MessageEmbed
} from "discord.js";
import fs from "fs";
import * as queryParser from "query-string";
import {
  Dictionary,
  NormalParameter,
  Parser,
  SearchResult,
  Word
} from "soxsot";
import {
  SingleLoader
} from "soxsot/dist/io";
import {
  GoogleClient
} from "/server/util/client";
import {
  getTempFilePath
} from "/server/util/misc";
import {
  COMMISSION_SPREADSHEET_ID,
  DICTIONARY_ID,
  HISTORY_SPREADSHEET_ID
} from "/server/variable";


export class ExtendedDictionary extends Dictionary {

  public static async fetch(): Promise<ExtendedDictionary> {
    let path = getTempFilePath("xdn");
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
    Object.setPrototypeOf(dictionary, ExtendedDictionary.prototype);
    return dictionary as any;
  }

  public static async upload(path: string): Promise<ExtendedDictionary> {
    let stream = fs.createReadStream(path);
    let loader = new SingleLoader(path);
    let [, dictionary] = await Promise.all([GoogleClient.instance.uploadFile(DICTIONARY_ID, stream), loader.asPromise()]);
    Object.setPrototypeOf(dictionary, ExtendedDictionary.prototype);
    return dictionary as any;
  }

  public async addCommissions(names: Array<string>): Promise<number> {
    let spreadsheet = await GoogleClient.instance.fetchSpreadsheet(COMMISSION_SPREADSHEET_ID);
    let sheet = spreadsheet.sheetsByIndex[0];
    let rows = await sheet.addRows(names.map((name) => ({name})));
    return rows.length;
  }

  // 現在の単語数を Google スプレッドシートに保存します。
  // 日付は 30 時間制のもの (0 時から 6 時までは通常の日付の前日になる) を利用します。
  public async saveHistory(): Promise<void> {
    let spreadsheet = await GoogleClient.instance.fetchSpreadsheet(HISTORY_SPREADSHEET_ID);
    let sheet = spreadsheet.sheetsByIndex[0];
    let rows = await sheet.getRows();
    let rawDate = new Date(new Date().getTime() - 6 * 60 * 60 * 1000);
    let rawUnsiftedDate = new Date();
    let date = formatToTimeZone(rawDate, "YYYY/MM/DD", {timeZone: "Asia/Tokyo"});
    let time = formatToTimeZone(rawUnsiftedDate, "YYYY/MM/DD HH:mm:ss", {timeZone: "Asia/Tokyo"});
    let count = this.words.length;
    let existingRow = rows.find((row) => row.date === date);
    if (existingRow !== undefined) {
      existingRow.time = time;
      existingRow.count = count;
      existingRow.save();
    } else {
      await sheet.addRow({date, time, count});
    }
  }

  public async fetchWordCountDifferences(durations: Array<number>): Promise<WordCountDifferencesResult> {
    let spreadsheet = await GoogleClient.instance.fetchSpreadsheet(HISTORY_SPREADSHEET_ID);
    let sheet = spreadsheet.sheetsByIndex[0];
    let rows = await sheet.getRows();
    let differences = durations.map((duration) => {
      let rawTargetDate = new Date(new Date().getTime() - duration * 24 * 60 * 60 * 1000 - 6 * 60 * 60 * 1000);
      let targetDate = formatToTimeZone(rawTargetDate, "YYYY/MM/DD", {timeZone: "Asia/Tokyo"});
      let targetCount = rows.find((row) => row.date === targetDate)?.count;
      if (targetCount !== undefined) {
        let difference = this.words.length - targetCount;
        return {duration, difference};
      } else {
        return {duration, difference: null};
      }
    });
    let count = this.words.length;
    let result = {count, differences};
    return result;
  }

  public static createWordTwitterText(rawWord: Word): string | undefined {
    let word = Parser.createSimple().parse(rawWord);
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
      text += ExtendedDictionary.createWordUrl(rawWord);
      return text;
    } else {
      return undefined;
    }
  }

  public static createWordDiscordEmbed(rawWord: Word): MessageEmbed | undefined {
    let word = Parser.createSimple().parse(rawWord);
    let section = word.parts["ja"]?.sections[0];
    if (section !== undefined) {
      let embed = new MessageEmbed();
      embed.title = word.name;
      embed.url = ExtendedDictionary.createWordUrl(rawWord);
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
  }

  public static createSearchResultDiscordEmbed(parameter: NormalParameter, result: SearchResult, page: number): MessageEmbed {
    let embed = new MessageEmbed();
    embed.title = "検索結果";
    embed.url = ExtendedDictionary.createParameterUrl(parameter);
    embed.description = "単語名が書かれたボタンを押すと、その単語の詳細情報が表示されます。矢印ボタンを押すと、前もしくは次のページの検索結果が表示されます。";
    let value = "";
    result.sliceWords(page).forEach((word, index) => {
      let parser = Parser.createSimple();
      let equivalentNames = parser.lookupEquivalentNames(word, "ja", true) ?? [];
      value += (index >= 9) ? "\u{1F51F}" : `${index + 1}\u{FE0F}\u{20E3}`;
      value += ` **${word.name}**`;
      value += ` — ${equivalentNames.join(", ")}`;
      value += "\n";
    });
    if (value === "") {
      value += "該当なし";
    }
    let firstIndex = result.sizePerPage * page + 1;
    let lastIndex = Math.min(result.words.length, result.sizePerPage * page + result.sizePerPage);
    let fieldName = `${firstIndex} 件目～ ${lastIndex} 件目 / ${result.words.length} 件`;
    embed.addField(fieldName, value);
    return embed;
  }

  public static createSearchResultDiscordComponents(parameter: NormalParameter, result: SearchResult, page: number): Array<MessageActionRow> {
    let wordButtons = result.sliceWords(page).map((word, index) => {
      let wordButton = new MessageButton();
      wordButton.setLabel(word.name);
      wordButton.setEmoji((index >= 9) ? "\u{1F51F}" : `${index + 1}\u{FE0F}\u{20E3}`);
      wordButton.setCustomID(queryParser.stringify({name: "word", uniqueName: word.uniqueName}));
      wordButton.setStyle("SECONDARY");
      return wordButton;
    });
    let wordRowCount = Math.ceil(wordButtons.length / 5);
    let wordRows = [...Array(wordRowCount)].map((value, index) => {
      let wordRow = new MessageActionRow();
      wordRow.addComponents(...wordButtons.slice(index * 5, (index + 1) * 5));
      return wordRow;
    });
    let previousPageButton = new MessageButton();
    let nextPageButton = new MessageButton();
    previousPageButton.setEmoji("\u{2B05}");
    previousPageButton.setCustomID(queryParser.stringify({name: "page", search: parameter.search, type: parameter.type, page: page - 1}));
    previousPageButton.setDisabled(page <= result.minPage);
    previousPageButton.setStyle("SECONDARY");
    nextPageButton.setEmoji("\u{27A1}");
    nextPageButton.setCustomID(queryParser.stringify({name: "page", search: parameter.search, type: parameter.type, page: page + 1}));
    nextPageButton.setDisabled(page >= result.maxPage);
    nextPageButton.setStyle("SECONDARY");
    let pageRow = new MessageActionRow();
    pageRow.addComponents(previousPageButton, nextPageButton);
    let components = [...wordRows, pageRow];
    return components;
  }

  public static createWordUrl(word: Word): string {
    return `https://dic.ziphil.com?search=${encodeURIComponent(word.name)}&mode=name&type=exact&ignoreDiacritic=false`;
  }

  public static createParameterUrl(parameter: NormalParameter): string {
    return `https://dic.ziphil.com?search=${encodeURIComponent(parameter.search)}&mode=${parameter.mode}&type=${parameter.type}`;
  }

}


export type WordCountDifferencesResult = {count: number, differences: Array<{duration: number, difference: number | null}>};