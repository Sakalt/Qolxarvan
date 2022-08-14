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
  GoogleClient,
  NotionClient,
  NotionData
} from "/server/util/client";
import {
  getTempFilePath
} from "/server/util/misc";
import {
  COMMISSION_NOTION_ID,
  DICTIONARY_ID,
  HISTORY_SPREADSHEET_ID
} from "/server/variable";


export class ExtendedDictionary extends Dictionary {

  public static async fetch(): Promise<ExtendedDictionary> {
    const path = getTempFilePath("xdn");
    const stream = await GoogleClient.instance.downloadFile(DICTIONARY_ID);
    const fileStream = fs.createWriteStream(path, {encoding: "utf-8"});
    const promise = new Promise<Dictionary>((resolve, reject) => {
      stream.on("data", (chunk) => {
        fileStream.write(chunk);
      });
      stream.on("end", async () => {
        fileStream.end();
        const loader = new SingleLoader(path);
        const dictionary = await loader.asPromise();
        await fs.promises.unlink(path);
        resolve(dictionary);
      });
      stream.on("error", (error) => {
        console.error(error);
        reject(error);
      });
    });
    const dictionary = await promise;
    Object.setPrototypeOf(dictionary, ExtendedDictionary.prototype);
    return dictionary as any;
  }

  public static async upload(path: string): Promise<ExtendedDictionary> {
    const stream = fs.createReadStream(path);
    const loader = new SingleLoader(path);
    const [, dictionary] = await Promise.all([GoogleClient.instance.uploadFile(DICTIONARY_ID, stream), loader.asPromise()]);
    Object.setPrototypeOf(dictionary, ExtendedDictionary.prototype);
    return dictionary as any;
  }

  public async addCommissions(names: Array<string>): Promise<number> {
    const promises = names.map(async (name) => {
      await NotionClient.instance.addPage(COMMISSION_NOTION_ID, [
        {name: "title", data: NotionData.createTitle([NotionData.createRichTextItem(name)])},
        {name: "依頼日", data: NotionData.createDate(new Date())}
      ]);
    });
    await Promise.all(promises);
    return names.length;
  }

  // 現在の単語数を Google スプレッドシートに保存します。
  // 日付は 30 時間制のもの (0 時から 6 時までは通常の日付の前日になる) を利用します。
  public async saveHistory(): Promise<void> {
    const spreadsheet = await GoogleClient.instance.fetchSpreadsheet(HISTORY_SPREADSHEET_ID);
    const sheet = spreadsheet.sheetsByIndex[0];
    const rows = await sheet.getRows();
    const rawDate = new Date(new Date().getTime() - 6 * 60 * 60 * 1000);
    const rawUnsiftedDate = new Date();
    const date = formatToTimeZone(rawDate, "YYYY/MM/DD", {timeZone: "Asia/Tokyo"});
    const time = formatToTimeZone(rawUnsiftedDate, "YYYY/MM/DD HH:mm:ss", {timeZone: "Asia/Tokyo"});
    const count = this.words.length;
    const existingRow = rows.find((row) => row.date === date);
    if (existingRow !== undefined) {
      existingRow.time = time;
      existingRow.count = count;
      existingRow.save();
    } else {
      await sheet.addRow({date, time, count});
    }
  }

  public async fetchWordCountDifferences(durations: Array<number>): Promise<WordCountDifferencesResult> {
    const spreadsheet = await GoogleClient.instance.fetchSpreadsheet(HISTORY_SPREADSHEET_ID);
    const sheet = spreadsheet.sheetsByIndex[0];
    const rows = await sheet.getRows();
    const differences = durations.map((duration) => {
      const rawTargetDate = new Date(new Date().getTime() - duration * 24 * 60 * 60 * 1000 - 6 * 60 * 60 * 1000);
      const targetDate = formatToTimeZone(rawTargetDate, "YYYY/MM/DD", {timeZone: "Asia/Tokyo"});
      const targetCount = rows.find((row) => row.date === targetDate)?.count;
      if (targetCount !== undefined) {
        const difference = this.words.length - targetCount;
        return {duration, difference};
      } else {
        return {duration, difference: null};
      }
    });
    const count = this.words.length;
    const result = {count, differences};
    return result;
  }

  public static createWordTwitterText(rawWord: Word): string | undefined {
    const word = Parser.createSimple().parse(rawWord);
    const section = word.parts["ja"]?.sections[0];
    if (section !== undefined) {
      let text = "";
      text += word.name;
      text += ` /${word.pronunciation}/ `;
      const equivalentStrings = section.getEquivalents(true).map((equivalent) => {
        const equivalentCategoryString = `〈${equivalent.category}〉`;
        const equivalentFrameString = (equivalent.frame !== null && equivalent.frame !== "") ? `(${equivalent.frame}) ` : "";
        const equivalentNameString = equivalent.names.join(", ");
        const equivalentString = equivalentCategoryString + equivalentFrameString + equivalentNameString;
        return equivalentString;
      });
      text += equivalentStrings?.join(" ") ?? "";
      const meaningInformation = section.getNormalInformations(true).find((information) => information.kind === "meaning");
      if (meaningInformation !== undefined) {
        const meaningText = meaningInformation.text;
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
    const word = Parser.createSimple().parse(rawWord);
    const section = word.parts["ja"]?.sections[0];
    if (section !== undefined) {
      const embed = new MessageEmbed();
      embed.title = word.name;
      embed.url = ExtendedDictionary.createWordUrl(rawWord);
      embed.color = 0xFFAB33;
      const equivalentStrings = section.getEquivalents(true).map((equivalent) => {
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
      const normalInformationFields = section.getNormalInformations(true).filter((information) => information.kind !== "task" && information.kind !== "history").map((information) => {
        const normalInformationField = {name: information.getKindName("ja")!, value: information.text, inline: false};
        return normalInformationField;
      });
      const phraseInformationFields = section.getPhraseInformations(true).map((information) => {
        let phraseInformationText = "";
        phraseInformationText += information.expression;
        phraseInformationText += ` — ${information.equivalentNames.join(", ")}`;
        if (information.text) {
          phraseInformationText += `\n${information.text}`;
        }
        const phraseInformationField = {name: information.getKindName("ja")!, value: phraseInformationText, inline: false};
        return phraseInformationField;
      });
      const exampleInformationFields = section.getExampleInformations(true).map((information) => {
        let exampleInformationText = "";
        exampleInformationText += information.sentence;
        exampleInformationText += ` → ${information.translation}`;
        const phraseInformationField = {name: information.getKindName("ja")!, value: exampleInformationText, inline: false};
        return phraseInformationField;
      });
      embed.addFields(...normalInformationFields, ...phraseInformationFields, ...exampleInformationFields);
      return embed;
    } else {
      return undefined;
    }
  }

  public static createSearchResultDiscordEmbed(parameter: NormalParameter, result: SearchResult, page: number): MessageEmbed {
    const embed = new MessageEmbed();
    embed.title = "検索結果";
    embed.url = ExtendedDictionary.createParameterUrl(parameter);
    embed.description = "単語名が書かれたボタンを押すと、その単語の詳細情報が表示されます。矢印ボタンを押すと、前もしくは次のページの検索結果が表示されます。";
    let value = "";
    result.sliceWords(page).forEach((word, index) => {
      const parser = Parser.createSimple();
      const equivalentNames = parser.lookupEquivalentNames(word, "ja", true) ?? [];
      value += (index >= 9) ? "\u{1F51F}" : `${index + 1}\u{FE0F}\u{20E3}`;
      value += ` **${word.name}**`;
      value += ` — ${equivalentNames.join(", ")}`;
      value += "\n";
    });
    if (value === "") {
      value += "該当なし";
    }
    const firstIndex = result.sizePerPage * page + 1;
    const lastIndex = Math.min(result.words.length, result.sizePerPage * page + result.sizePerPage);
    const fieldName = `${firstIndex} 件目～ ${lastIndex} 件目 / ${result.words.length} 件`;
    embed.addField(fieldName, value);
    return embed;
  }

  public static createSearchResultDiscordComponents(parameter: NormalParameter, result: SearchResult, page: number): Array<MessageActionRow> {
    const wordButtons = result.sliceWords(page).map((word, index) => {
      const wordButton = new MessageButton();
      wordButton.setLabel(word.name);
      wordButton.setEmoji((index >= 9) ? "\u{1F51F}" : `${index + 1}\u{FE0F}\u{20E3}`);
      wordButton.setCustomID(queryParser.stringify({name: "word", uniqueName: word.uniqueName}));
      wordButton.setStyle("SECONDARY");
      return wordButton;
    });
    const wordRowCount = Math.ceil(wordButtons.length / 5);
    const wordRows = [...Array(wordRowCount)].map((value, index) => {
      const wordRow = new MessageActionRow();
      wordRow.addComponents(...wordButtons.slice(index * 5, (index + 1) * 5));
      return wordRow;
    });
    const previousPageButton = new MessageButton();
    const nextPageButton = new MessageButton();
    previousPageButton.setEmoji("\u{2B05}\u{FE0F}");
    previousPageButton.setCustomID(queryParser.stringify({name: "page", search: parameter.search, type: parameter.type, page: page - 1}));
    previousPageButton.setDisabled(page <= result.minPage);
    previousPageButton.setStyle("SECONDARY");
    nextPageButton.setEmoji("\u{27A1}\u{FE0F}");
    nextPageButton.setCustomID(queryParser.stringify({name: "page", search: parameter.search, type: parameter.type, page: page + 1}));
    nextPageButton.setDisabled(page >= result.maxPage);
    nextPageButton.setStyle("SECONDARY");
    const pageRow = new MessageActionRow();
    pageRow.addComponents(previousPageButton, nextPageButton);
    const components = [...wordRows, pageRow];
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