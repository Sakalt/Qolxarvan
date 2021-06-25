//

import {
  Client,
  Message,
  MessageEmbed,
  Snowflake,
  TextChannel
} from "discord.js";
import {
  DISCORD_IDS
} from "/server/discord/id";


export class Quiz {

  public readonly number: number;
  public readonly difficulty: string | null;
  public readonly sentences: QuizSentences;
  public readonly choices: ReadonlyArray<QuizChoice>;
  public readonly answer: string;
  public readonly commentary: string;
  public readonly urls: QuizUrls;

  private constructor(number: number, difficulty: string | null, sentences: QuizSentences, choices: ReadonlyArray<QuizChoice>, answer: string, commentary: string, urls: QuizUrls) {
    this.number = number;
    this.difficulty = difficulty;
    this.sentences = sentences;
    this.choices = choices;
    this.answer = answer;
    this.commentary = commentary;
    this.urls = urls;
  }

  public static async *iterate(client: Client): AsyncGenerator<QuizIteration> {
    for await (let {number, sources} of Quiz.iterateRaw(client)) {
      let quiz = Quiz.parse(sources);
      if (quiz !== undefined) {
        yield {number, sources, quiz};
      }
    }
  }

  public static async *iterateRaw(client: Client): AsyncGenerator<QuizRawIteration> {
    let channel = client.channels.cache.get(DISCORD_IDS.channel.sokad.zelad);
    if (channel instanceof TextChannel) {
      let before = undefined as Snowflake | undefined;
      let sourceMap = new Map<number, Partial<QuizSources>>();
      while (true) {
        let messages = await channel.messages.fetch({limit: 100, before});
        for (let [, message] of messages) {
          let problemMatch = message.content.match(/^\*\*\[\s*(\d+)\s*\]\*\*\s*(☆|★)*\s*\n/);
          let commentaryMatch = message.content.match(/^\*\*\[\s*(\d+)\s*\]\*\*\s*解説\s*\n/);
          if (problemMatch !== null || commentaryMatch !== null) {
            let number = +(problemMatch ?? commentaryMatch)![1];
            let partialSources = sourceMap.get(number) ?? {};
            if (problemMatch !== null) {
              partialSources.problem = message;
            } else {
              partialSources.commentary = message;
            }
            if (partialSources.problem !== undefined && partialSources.commentary !== undefined) {
              sourceMap.delete(number);
              let sources = partialSources as QuizSources;
              yield {number, sources};
            } else {
              sourceMap.set(number, partialSources);
            }
          }
        }
        before = messages.last()?.id;
        if (messages.size < 100) {
          break;
        }
      }
    }
  }

  public static async findByNumber(client: Client, number: number): Promise<Quiz | undefined> {
    for await (let iteration of Quiz.iterateRaw(client)) {
      if (iteration.number === number) {
        let quiz = Quiz.parse(iteration.sources);
        return quiz;
      }
    }
    return undefined;
  }

  public static parse(sources: QuizSources): Quiz | undefined {
    let wholeMatch = sources.commentary.content.match(/^(.+?)―{2,}\s*\n\s*\|\|(.+?)\|\|/s);
    if (wholeMatch) {
      let mainLines = wholeMatch[1].trim().split(/\n/);
      let commentaryLines = wholeMatch[2].trim().split(/\n/);
      let numberMatch = mainLines[0]?.match(/^\*\*\[\s*(\d+)\s*\]\*\*/);
      let difficultyMatch = sources.problem.content.match(/^\*\*\[\s*(\d+)\s*\]\*\*(?:\s*((?:☆|★)+))?/m);
      let shaleianMatch = mainLines[1]?.match(/^>\s*(.+)/);
      let translationMatch = mainLines[2]?.match(/^>\s*(.+)/);
      let choiceMatch = mainLines[3]?.matchAll(/(..\u{20E3}|[\u{1F1E6}-\u{1F1FF}])\s*(.+?)\s*(　|$)/gu);
      let answerMatch = commentaryLines[0]?.match(/\*\*\s*正解\s*\*\*\s*:\s*(.+)/);
      if (mainLines.length >= 4 && commentaryLines.length >= 2 && numberMatch && shaleianMatch && translationMatch && answerMatch) {
        let number = +numberMatch[1];
        let difficulty = (difficultyMatch !== null) ? difficultyMatch[2] ?? null : null;
        let shaleianSentence = shaleianMatch[1].trim();
        let translationSentence = translationMatch[1].trim();
        let sentences = {shaleian: shaleianSentence, translation: translationSentence};
        let choices = Array.from(choiceMatch).map((match) => ({mark: match[1], content: match[2]}));
        let answer = answerMatch[1].trim();
        let commentary = commentaryLines.slice(1, -1).join("").trim();
        let urls = {problem: sources.problem.url, commentary: sources.commentary.url};
        let quiz = new Quiz(number, difficulty, sentences, choices, answer, commentary, urls);
        return quiz;
      } else {
        return undefined;
      }
    }
  }

  public createDiscordEmbed(): MessageEmbed {
    let embed = new MessageEmbed();
    embed.title = `第 ${this.number} 問`;
    embed.description = this.questionMarkup;
    embed.color = 0x33C3FF;
    embed.addField("正解", `||${this.answer}||`, true);
    embed.addField("難易度", `${this.difficulty ?? "?"}`, true);
    embed.addField("投稿リンク", `[問題](${this.urls.problem}) · [解説](${this.urls.commentary})`, true);
    embed.addField("解説", `||${this.commentary}||`, false);
    return embed;
  }

  public get questionMarkup(): string {
    let markup = "";
    markup += `> ${this.sentences.shaleian}\n`;
    markup += `> ${this.sentences.translation}\n`;
    markup += this.choices.map((choice) => `${choice.mark} ${choice.content}`).join("　");
    return markup;
  }

}


export type QuizSentences = Readonly<{shaleian: string, translation: string}>;
export type QuizChoice = Readonly<{mark: string, content: string}>;
export type QuizUrls = Readonly<{problem: string, commentary: string}>;

type QuizSources = {problem: Message, commentary: Message};
type QuizRawIteration = {number: number, sources: QuizSources};
type QuizIteration = {number: number, sources: QuizSources, quiz: Quiz};