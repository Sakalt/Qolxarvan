//

import {
  Client,
  EmbedBuilder,
  Message,
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
    for await (const {number, sources} of Quiz.iterateRaw(client)) {
      const quiz = Quiz.parse(sources);
      if (quiz !== undefined) {
        yield {number, sources, quiz};
      }
    }
  }

  public static async *iterateRaw(client: Client): AsyncGenerator<QuizRawIteration> {
    const channel = client.channels.cache.get(DISCORD_IDS.channel.sokad.zelad);
    if (channel instanceof TextChannel) {
      let before = undefined as Snowflake | undefined;
      const sourceMap = new Map<number, Partial<QuizSources>>();
      while (true) {
        const messages = await channel.messages.fetch({limit: 100, before});
        for (const [, message] of messages) {
          const problemMatch = message.content.match(/^\*\*\[\s*(\d+)\s*\]\*\*\s*(☆|★)*\s*\n/);
          const commentaryMatch = message.content.match(/^\*\*\[\s*(\d+)\s*\]\*\*\s*解説\s*\n/);
          if (problemMatch !== null || commentaryMatch !== null) {
            const number = +(problemMatch ?? commentaryMatch)![1];
            const partialSources = sourceMap.get(number) ?? {};
            if (problemMatch !== null) {
              partialSources.problem = message;
            } else {
              partialSources.commentary = message;
            }
            if (partialSources.problem !== undefined && partialSources.commentary !== undefined) {
              sourceMap.delete(number);
              const sources = partialSources as QuizSources;
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
    for await (const iteration of Quiz.iterateRaw(client)) {
      if (iteration.number === number) {
        const quiz = Quiz.parse(iteration.sources);
        return quiz;
      }
    }
    return undefined;
  }

  public static parse(sources: QuizSources): Quiz | undefined {
    const wholeMatch = sources.commentary.content.match(/^(.+?)―{2,}\s*\n\s*\|\|(.+?)\|\|/s);
    if (wholeMatch) {
      const mainLines = wholeMatch[1].trim().split(/\n/);
      const commentaryLines = wholeMatch[2].trim().split(/\n/);
      const numberMatch = mainLines[0]?.match(/^\*\*\[\s*(\d+)\s*\]\*\*/);
      const difficultyMatch = sources.problem.content.match(/^\*\*\[\s*(\d+)\s*\]\*\*(?:\s*((?:☆|★)+))?/m);
      const shaleianMatch = mainLines[1]?.match(/^>\s*(.+)/);
      const translationMatch = mainLines[2]?.match(/^>\s*(.+)/);
      const choiceMatch = mainLines[3]?.matchAll(/(..\u{20E3}|[\u{1F1E6}-\u{1F1FF}])\s*(.+?)\s*(　|$)/gu);
      const answerMatch = commentaryLines[0]?.match(/\*\*\s*正解\s*\*\*\s*:\s*(.+)/);
      if (mainLines.length >= 4 && commentaryLines.length >= 2 && numberMatch && shaleianMatch && translationMatch && answerMatch) {
        const number = +numberMatch[1];
        const difficulty = (difficultyMatch !== null) ? difficultyMatch[2] ?? null : null;
        const shaleianSentence = shaleianMatch[1].trim();
        const translationSentence = translationMatch[1].trim();
        const sentences = {shaleian: shaleianSentence, translation: translationSentence};
        const choices = Array.from(choiceMatch).map((match) => ({mark: match[1], content: match[2]}));
        const answer = answerMatch[1].trim();
        const commentary = commentaryLines.slice(1, -1).join("").trim();
        const urls = {problem: sources.problem.url, commentary: sources.commentary.url};
        const quiz = new Quiz(number, difficulty, sentences, choices, answer, commentary, urls);
        return quiz;
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  public createDiscordEmbed(): EmbedBuilder {
    const embed = new EmbedBuilder();
    embed.setTitle(`第 ${this.number} 問`);
    embed.setDescription(this.questionMarkup);
    embed.setColor(0x33C3FF);
    embed.addFields({name: "正解", value: `||${this.answer}||`, inline: true});
    embed.addFields({name: "難易度", value: `${this.difficulty ?? "?"}`, inline: true});
    embed.addFields({name: "投稿リンク", value: `[問題](${this.urls.problem}) · [解説](${this.urls.commentary})`, inline: true});
    embed.addFields({name: "解説", value: `||${this.commentary}||`, inline: false});
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