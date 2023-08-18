//

import {
  Client,
  EmbedBuilder,
  Snowflake,
  User
} from "discord.js";
import {
  GoogleSpreadsheetWorksheet
} from "google-spreadsheet";
import {
  GoogleClient
} from "/server/util/client";
import {
  Quiz,
  QuizUrls
} from "/server/util/quiz/quiz";
import {
  QUIZ_SPREADSHEET_ID
} from "/server/variable";


export class QuizRecord {

  public readonly user: User;
  public readonly results: ReadonlyMap<number, QuizResult>;

  private constructor(user: User, results: ReadonlyMap<number, QuizResult>) {
    this.user = user;
    this.results = results;
  }

  /** 与えられた番号のクイズの結果データを Google スプレッドシートに保存します。*/
  public static async save(client: Client, number: number) {
    const sheet = await QuizRecord.getSheet();
    const [quiz, statuses] = await QuizRecord.calcStatuses(client, number);
    if (quiz !== undefined) {
      const header = await QuizRecord.createHeader(sheet);
      await QuizRecord.loadCellsForSave(sheet, number);
      for (const [id, status] of statuses) {
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
    const iteration = await (async () => {
      for await (const iteration of Quiz.iterate(client)) {
        if (iteration.number === number) {
          return iteration;
        }
      }
      return undefined;
    })();
    if (iteration !== undefined) {
      const {sources, quiz} = iteration;
      const selectionsMap = new Map<Snowflake, Array<string>>();
      const promises = quiz.choices.map(async (choice) => {
        const mark = choice.mark;
        const reaction = sources.problem.reactions.resolve(mark);
        const users = await reaction?.users.fetch() ?? [];
        for (const [, user] of users) {
          const selections = selectionsMap.get(user.id) ?? [];
          selections.push(mark);
          selectionsMap.set(user.id, selections);
        }
      });
      await Promise.all(promises);
      const statusEntries = Array.from(selectionsMap.entries()).map(([id, selections]) => {
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
      const statuses = new Map(statusEntries);
      return [quiz, statuses];
    } else {
      return [undefined, new Map()];
    }
  }

  /** 与えられたユーザーのクイズの成績を取得します。
   * Google スプレッドシートのデータをもとに成績を取得するため、返されるデータはスプレッドシートに保存された段階での成績であり、最新のデータであるとは限りません。*/
  public static async fetch(client: Client, user: User): Promise<QuizRecord> {
    const sheet = await QuizRecord.getSheet();
    const header = await QuizRecord.createHeader(sheet);
    const columnIndex = header.findIndex((candidateId) => candidateId === user.id);
    if (columnIndex >= 0) {
      await QuizRecord.loadCellsForFetch(sheet, columnIndex);
      const rowCount = sheet.rowCount;
      const results = new Map<number, QuizResult>();
      for (let number = 1 ; number < rowCount ; number ++) {
        const exist = sheet.getCell(number, 0).value !== null;
        const status = sheet.getCell(number, columnIndex).value as QuizStatus | null;
        if (exist) {
          if (status !== null) {
            const urls = {problem: sheet.getCell(number, 1).value?.toString() ?? "", commentary: sheet.getCell(number, 2).value?.toString() ?? ""};
            results.set(number, {status, urls});
          }
        } else {
          break;
        }
      }
      const record = new QuizRecord(user, results);
      return record;
    } else {
      const record = new QuizRecord(user, new Map());
      return record;
    }
  }

  /** 与えられたユーザーのクイズの成績を取得します。
   * Discord から直接情報を取得して成績を集計するため、返されるデータは常に最新のものになります。
   * ただし、Discord API を大量に呼び出す関係上、動作は非常に低速です。*/
  public static async fetchDirect(client: Client, user: User): Promise<QuizRecord> {
    const results = new Map<number, QuizResult>();
    const iterations = [];
    for await (const iteration of Quiz.iterate(client)) {
      iterations.push(iteration);
    }
    const promises = iterations.map(async ({quiz, sources}) => {
      const selectPromises = quiz.choices.map((choice) => {
        const mark = choice.mark;
        const reaction = sources.problem.reactions.resolve(mark);
        const selectPromise = reaction?.users.fetch().then((selectUsers) => {
          const selected = selectUsers.find((selectUser) => selectUser.id === user.id) !== undefined;
          return {mark, selected};
        });
        return selectPromise ?? {mark, selected: false};
      });
      const selectResults = await Promise.all(selectPromises);
      let correct = false;
      let wrong = false;
      for (const selectResult of selectResults) {
        if (selectResult.selected) {
          if (selectResult.mark === quiz.answer) {
            correct = true;
          } else {
            wrong = true;
          }
        }
      }
      if (correct || wrong) {
        const status = (correct && wrong) ? "invalid" : (correct) ? "correct" : "wrong" as any;
        const urls = quiz.urls;
        results.set(quiz.number, {status, urls});
      }
    });
    await Promise.all(promises);
    const record = new QuizRecord(user, results);
    return record;
  }

  private static async getSheet(): Promise<GoogleSpreadsheetWorksheet> {
    const spreadsheet = await GoogleClient.instance.fetchSpreadsheet(QUIZ_SPREADSHEET_ID);
    const sheet = spreadsheet.sheetsByIndex[0];
    return sheet;
  }

  private static async createHeader(sheet: GoogleSpreadsheetWorksheet): Promise<Array<Snowflake>> {
    const wholeColumnCount = sheet.columnCount;
    await sheet.loadCells({startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: wholeColumnCount});
    const columnCount = sheet.columnCount;
    const header = [];
    for (let index = 0 ; index < columnCount ; index ++) {
      const cell = sheet.getCell(0, index);
      if (cell.value !== null) {
        header[index] = cell.value.toString() ;
      } else {
        break;
      }
    }
    return header;
  }

  private static async loadCellsForSave(sheet: GoogleSpreadsheetWorksheet, number: number): Promise<void> {
    const wholeColumnCount = sheet.columnCount;
    await sheet.loadCells([
      {startRowIndex: number, endRowIndex: number + 1, startColumnIndex: 0, endColumnIndex: wholeColumnCount}
    ]);
  }

  private static async loadCellsForFetch(sheet: GoogleSpreadsheetWorksheet, columnIndex: number): Promise<void> {
    const wholeRowCount = sheet.rowCount;
    await sheet.loadCells([
      {startRowIndex: 0, endRowIndex: wholeRowCount, startColumnIndex: 0, endColumnIndex: 3},
      {startRowIndex: 0, endRowIndex: wholeRowCount, startColumnIndex: columnIndex, endColumnIndex: columnIndex + 1}
    ]);
  }

  public createDiscordEmbed(): EmbedBuilder {
    const embed = new EmbedBuilder();
    const counts = this.counts;
    embed.setTitle("シャレイア語検定成績");
    embed.setColor(0x33C3FF);
    embed.setAuthor({name: this.user.username, iconURL: this.user.avatarURL() ?? undefined});
    const correctPercentString = (counts.all > 0) ? `(**${(counts.correct / counts.all * 100).toFixed(1)}** %)` : "(**0.0** %)";
    const wrongPercentString = (counts.all > 0) ? `(**${(counts.wrong / counts.all * 100).toFixed(1)}** %)` : "(**0.0** %)";
    const invalidPercentString = (counts.all > 0) ? `(**${(counts.invalid / counts.all * 100).toFixed(1)}** %)` : "(**0.0** %)";
    embed.addFields({name: "\u{2705} 正解", value: `**${counts.correct}** / ${counts.all} ${correctPercentString}`, inline: true});
    embed.addFields({name: "\u{274E} 不正解", value: `**${counts.wrong}** / ${counts.all} ${wrongPercentString}`, inline: true});
    embed.addFields({name: "\u{1F6AB} 無効", value: `**${counts.invalid}** / ${counts.all} ${invalidPercentString}`, inline: true});
    if (this.results.size > 0) {
      embed.addFields({name: "個別成績", value: this.resultMarkup, inline: false});
    }
    return embed;
  }

  public get resultMarkup(): string {
    let markup = "";
    if (this.results.size > 0) {
      const entries = Array.from(this.results.entries()).sort(([firstNumber], [secondNumber]) => secondNumber - firstNumber);
      const resultMarkups = entries.map(([number, result]) => {
        const statusMark = (result.status === "invalid") ? "\u{1F6AB}" : (result.status === "correct") ? "\u{2705}" : "\u{274E}";
        return `${number} ${statusMark}`;
      });
      markup += resultMarkups.join(" · ");
    } else {
      markup += "データがありません";
    }
    return markup;
  }

  public get counts(): QuizResultCounts {
    const counts = {all: 0, correct: 0, wrong: 0, invalid: 0};
    this.results.forEach((result) => {
      counts.all ++;
      counts[result.status] ++;
    });
    return counts;
  }

}


export type QuizStatus = "correct" | "wrong" | "invalid";
export type QuizResult = Readonly<{status: QuizStatus, urls: QuizUrls}>;
export type QuizResultCounts = {all: number, correct: number, wrong: number, invalid: number};