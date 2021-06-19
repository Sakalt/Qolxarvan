//

import {
  Client,
  MessageEmbed,
  Snowflake,
  User
} from "discord.js";
import {
  GoogleSpreadsheetWorksheet
} from "google-spreadsheet";
import {
  GoogleUtils
} from "/server/util/google";
import {
  Quiz,
  QuizUrls
} from "/server/util/quiz/quiz";
import {
  QUIZ_SPREADSHEET_ID
} from "/server/variable";


export class QuizRecord {

  public readonly user: User;
  public readonly results: ReadonlyMap<number, Readonly<QuizResult>>;

  private constructor(user: User, results: Map<number, QuizResult>) {
    this.user = user;
    this.results = results;
  }

  // 与えられた番号のクイズの結果データを Google スプレッドシートに保存します。
  public static async save(client: Client, number: number) {
    let sheet = await QuizRecord.getSheet();
    let [quiz, statuses] = await QuizRecord.calcStatuses(client, number);
    if (quiz !== undefined) {
      let header = await QuizRecord.createHeader(sheet);
      await QuizRecord.loadCellsForSave(sheet, number);
      for (let [id, status] of statuses) {
        let columnIndex = header.findIndex((candidateId) => candidateId === id);
        if (columnIndex < 0) {
          columnIndex = header.length;
          sheet.getCell(0, columnIndex).value = id;
          header.push(id);
        }
        sheet.getCell(number, columnIndex).value = status;
      }
      sheet.getCell(number, 1).value = quiz.urls.problem;
      sheet.getCell(number, 2).value = quiz.urls.commentary;
      await sheet.saveUpdatedCells();
    }
  }

  private static async calcStatuses(client: Client, number: number): Promise<[Quiz | undefined, Map<Snowflake, QuizStatus>]> {
    let iteration = await (async () => {
      for await (let iteration of Quiz.iterate(client)) {
        if (iteration.number === number) {
          return iteration;
        }
      }
    })();
    if (iteration !== undefined) {
      let {sources, quiz} = iteration;
      let selectionsMap = new Map<Snowflake, Array<string>>();
      let promises = quiz.choices.map(async (choice) => {
        let mark = choice.mark;
        let reaction = sources.problem.reactions.resolve(mark);
        let users = await reaction?.users.fetch() ?? [];
        for (let [, user] of users) {
          let selections = selectionsMap.get(user.id) ?? [];
          selections.push(mark);
          selectionsMap.set(user.id, selections);
        }
      });
      await Promise.all(promises);
      let statusEntries = Array.from(selectionsMap.entries()).map(([id, selections]) => {
        if (selections.length > 1) {
          return [id, "invalid"] as const;
        } else {
          if (selections[0] === quiz.answer) {
            return [id, "correct"] as const;
          } else {
            return [id, "wrong"] as const;
          }
        }
      });
      let statuses = new Map(statusEntries);
      return [quiz, statuses];
    } else {
      return [undefined, new Map()];
    }
  }

  // 与えられたユーザーのクイズの成績を取得します。
  // Google スプレッドシートのデータをもとに成績を取得するため、返されるデータはスプレッドシートに保存された段階での成績であり、最新のデータであるとは限りません。
  public static async fetch(client: Client, user: User): Promise<QuizRecord> {
    let sheet = await QuizRecord.getSheet();
    let header = await QuizRecord.createHeader(sheet);
    let columnIndex = header.findIndex((candidateId) => candidateId === user.id);
    await QuizRecord.loadCellsForFetch(sheet, columnIndex);
    let rowCount = sheet.rowCount;
    let results = new Map<number, QuizResult>();
    for (let number = 1 ; number < rowCount ; number ++) {
      let exist = sheet.getCell(number, 0).value !== null;
      let status = sheet.getCell(number, columnIndex).value as QuizStatus | null;
      if (exist) {
        if (status !== null) {
          let urls = {problem: sheet.getCell(number, 1).value?.toString() ?? "", commentary: sheet.getCell(number, 2).value?.toString() ?? ""};
          results.set(number, {status, urls});
        }
      } else {
        break;
      }
    }
    let record = new QuizRecord(user, results);
    return record;
  }

  // 与えられたユーザーのクイズの成績を取得します。
  // Discord から直接情報を取得して成績を集計するため、返されるデータは常に最新のものになります。
  // ただし、Discord API を大量に呼び出す関係上、動作は非常に低速です。
  public static async fetchDirect(client: Client, user: User): Promise<QuizRecord> {
    let results = new Map<number, QuizResult>();
    let iterations = [];
    for await (let iteration of Quiz.iterate(client)) {
      iterations.push(iteration);
    }
    let promises = iterations.map(async ({quiz, sources}) => {
      let selectPromises = quiz.choices.map((choice) => {
        let mark = choice.mark;
        let reaction = sources.problem.reactions.resolve(mark);
        let selectPromise = reaction?.users.fetch().then((selectUsers) => {
          let selected = selectUsers.find((selectUser) => selectUser.id === user.id) !== undefined;
          return {mark, selected};
        });
        return selectPromise ?? {mark, selected: false};
      });
      let selectResults = await Promise.all(selectPromises);
      let correct = false;
      let wrong = false;
      for (let selectResult of selectResults) {
        if (selectResult.selected) {
          if (selectResult.mark === quiz.answer) {
            correct = true;
          } else {
            wrong = true;
          }
        }
      }
      if (correct || wrong) {
        let status = (correct && wrong) ? "invalid" : (correct) ? "correct" : "wrong" as any;
        let urls = quiz.urls;
        results.set(quiz.number, {status, urls});
      }
    });
    await Promise.all(promises);
    let record = new QuizRecord(user, results);
    return record;
  }

  private static async getSheet(): Promise<GoogleSpreadsheetWorksheet> {
    let spreadsheet = await GoogleUtils.fetchSpreadsheet(QUIZ_SPREADSHEET_ID);
    let sheet = spreadsheet.sheetsByIndex[0];
    return sheet;
  }

  private static async createHeader(sheet: GoogleSpreadsheetWorksheet): Promise<Array<Snowflake>> {
    let wholeColumnCount = sheet.columnCount;
    await sheet.loadCells({startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: wholeColumnCount});
    let columnCount = sheet.columnCount;
    let header = [];
    for (let index = 0 ; index < columnCount ; index ++) {
      let cell = sheet.getCell(0, index);
      if (cell.value !== null) {
        header[index] = cell.value.toString();
      } else {
        break;
      }
    }
    return header;
  }

  private static async loadCellsForSave(sheet: GoogleSpreadsheetWorksheet, number: number): Promise<void> {
    let wholeColumnCount = sheet.columnCount;
    await sheet.loadCells([
      {startRowIndex: number, endRowIndex: number + 1, startColumnIndex: 0, endColumnIndex: wholeColumnCount}
    ]);
  }

  private static async loadCellsForFetch(sheet: GoogleSpreadsheetWorksheet, columnIndex: number): Promise<void> {
    let wholeRowCount = sheet.rowCount;
    await sheet.loadCells([
      {startRowIndex: 0, endRowIndex: wholeRowCount, startColumnIndex: 0, endColumnIndex: 3},
      {startRowIndex: 0, endRowIndex: wholeRowCount, startColumnIndex: columnIndex, endColumnIndex: columnIndex + 1}
    ]);
  }

  public createEmbed(): MessageEmbed {
    let embed = new MessageEmbed();
    let counts = this.counts;
    embed.title = "シャレイア語検定成績";
    embed.color = 0x33C3FF;
    embed.setAuthor(this.user.username, this.user.avatarURL() ?? undefined);
    let correctPercentString = (counts.all > 0) ? ` (**${(counts.correct / counts.all * 100).toFixed(1)}** %)` : "";
    let wrongPercentString = (counts.all > 0) ? ` (**${(counts.wrong / counts.all * 100).toFixed(1)}** %)` : "";
    let invalidPercentString = (counts.all > 0) ? ` (**${(counts.invalid / counts.all * 100).toFixed(1)}** %)` : "";
    embed.addField("\u{2705} 正解", `**${counts.correct}** / ${counts.all}${correctPercentString}`, true);
    embed.addField("\u{274E} 不正解", `**${counts.wrong}** / ${counts.all}${wrongPercentString}`, true);
    embed.addField("\u{1F6AB} 無効", `**${counts.invalid}** / ${counts.all}${invalidPercentString}`, true);
    if (this.results.size > 0) {
      embed.addField("個別成績", this.resultMarkup, false);
    }
    return embed;
  }

  public get resultMarkup(): string {
    let markup = "";
    if (this.results.size > 0) {
      let entries = Array.from(this.results.entries()).sort(([firstNumber], [secondNumber]) => secondNumber - firstNumber);
      let resultMarkups = entries.map(([number, result]) => {
        let statusMark = (result.status === "invalid") ? "\u{1F6AB}" : (result.status === "correct") ? "\u{2705}" : "\u{274E}";
        return `${number} ${statusMark}`;
      });
      markup += resultMarkups.join(" · ");
    } else {
      markup += "データがありません";
    }
    return markup;
  }

  public get counts(): QuizResultCounts {
    let counts = {all: 0, correct: 0, wrong: 0, invalid: 0};
    this.results.forEach((result) => {
      counts.all ++;
      counts[result.status] ++;
    });
    return counts;
  }

}


export type QuizStatus = "correct" | "wrong" | "invalid";
export type QuizResult = {status: QuizStatus, urls: QuizUrls};
export type QuizResultCounts = {all: number, correct: number, wrong: number, invalid: number};