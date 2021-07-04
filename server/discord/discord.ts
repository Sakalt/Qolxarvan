//

import {
  ApplicationCommandOptionType as CommandOptionType
} from "discord-api-types";
import {
  CommandInteraction,
  Message
} from "discord.js";
import {
  ParsedQuery
} from "query-string";
import {
  NormalParameter,
  WordType
} from "soxsot";
import {
  Controller
} from "/server/discord/controller";
import {
  button,
  controller,
  listener,
  slash
} from "/server/discord/decorator";
import {
  DISCORD_IDS
} from "/server/discord/id";
import {
  DiscordClient
} from "/server/util/client/discord";
import {
  ExtendedDictionary
} from "/server/util/dictionary";
import {
  Quiz
} from "/server/util/quiz/quiz";
import {
  QuizRecord
} from "/server/util/quiz/quiz-record";


@controller()
export class DiscordController extends Controller {

  @listener("ready")
  private async [Symbol()](client: DiscordClient): Promise<void> {
    let url = "https://github.com/Ziphil/ShaleianOnline";
    let presence = client.user?.setPresence({activities: [{name: "xalzih", url}]});
    await client.log("Discord ready");
  }

  @slash("sitay", "ボットが動いているかどうか確認します。")
  private async [Symbol()](client: DiscordClient, interaction: CommandInteraction): Promise<void> {
    await interaction.reply("sîya!");
  }

  @slash("sotik", "オンライン辞典から指定された綴りの単語エントリーを抽出して返信します。", [
    {name: "name", type: CommandOptionType.STRING, required: true, description: "表示する単語の綴り"}
  ])
  private async [Symbol()](client: DiscordClient, interaction: CommandInteraction): Promise<void> {
    let name = interaction.options.get("name")!.value! as string;
    let dictionary = await ExtendedDictionary.fetch();
    let word = dictionary.words.find((word) => word.name === name);
    let embed = (word !== undefined) ? ExtendedDictionary.createWordDiscordEmbed(word) : undefined;
    if (embed !== undefined) {
      await interaction.reply({embeds: [embed]});
    } else {
      await interaction.reply(`kocaqat a sotik adak iva “${name}”.`);
    }
  }

  @slash("palev", "オンライン辞典から検索 (見出し語と訳語の両方から完全一致と前方一致) を行ってその結果を返信します。", [
    {name: "search", type: CommandOptionType.STRING, required: true, description: "検索する内容"}
  ])
  private async [Symbol()](client: DiscordClient, interaction: CommandInteraction): Promise<void> {
    let search = interaction.options.get("search")!.value! as string;
    let dictionary = await ExtendedDictionary.fetch();
    let exactParameter = new NormalParameter(search, "both", "exact", "ja", {diacritic: false, case: false});
    let prefixParameter = new NormalParameter(search, "both", "prefix", "ja");
    let exactResult = dictionary.search(exactParameter);
    let prefixResult = dictionary.search(prefixParameter);
    let displayedWord = (exactResult.words.length > 0) ? exactResult.words[0] : (prefixResult.words.length > 0) ? prefixResult.words[0] : undefined;
    if (displayedWord !== undefined) {
      let resultEmbed = ExtendedDictionary.createSearchResultDiscordEmbed(prefixParameter, exactResult, 0);
      let wordEmbed = ExtendedDictionary.createWordDiscordEmbed(displayedWord);
      let count = prefixResult.words.length;
      await interaction.reply({content: `kotikak a'l e sotik al'${count}. cafosis a'l e met acates.`, embeds: [resultEmbed, wordEmbed!]});
    } else {
      let resultEmbed = ExtendedDictionary.createSearchResultDiscordEmbed(prefixParameter, exactResult, 0);
      await interaction.reply({content: "kotikak a'l e sotik adak.", embeds: [resultEmbed]});
    }
  }

  @slash("palev-cac", "オンライン辞典から検索 (見出し語と訳語の両方から) を行ってその結果を返信します。", [
    {name: "search", type: CommandOptionType.STRING, required: true, description: "検索する内容"},
    {name: "exact", type: CommandOptionType.BOOLEAN, required: false, description: "完全一致にするかどうか (true: 完全一致, false: 部分一致)"}
  ])
  private async [Symbol()](client: DiscordClient, interaction: CommandInteraction): Promise<void> {
    let search = interaction.options.get("search")?.value! as string;
    let exact = interaction.options.get("exact")?.value as boolean | undefined;
    await interaction.defer();
    let dictionary = await ExtendedDictionary.fetch();
    let parameter = new NormalParameter(search, "both", (exact) ? "exact" : "part", "ja", {diacritic: true, case: false});
    let result = dictionary.search(parameter);
    result.sizePerPage = 10;
    if (result.words.length > 0) {
      let embed = ExtendedDictionary.createSearchResultDiscordEmbed(parameter, result, 0);
      let components = ExtendedDictionary.createSearchResultDiscordComponents(parameter, result, 0);
      let count = result.words.length;
      await interaction.followUp({content: `kotikak a'l e sotik al'${count}. cafosis a'l e met acates.`, embeds: [embed], components});
    } else {
      let embed = ExtendedDictionary.createSearchResultDiscordEmbed(parameter, result, 0);
      await interaction.followUp({content: "kotikak a'l e sotik adak.", embeds: [embed]});
    }
  }

  @button("word")
  private async [Symbol()](client: DiscordClient, query: ParsedQuery, interaction: CommandInteraction): Promise<void> {
    let uniqueName = query.uniqueName! as string;
    await interaction.defer();
    let dictionary = await ExtendedDictionary.fetch();
    let word = dictionary.findByUniqueName(uniqueName);
    let embed = (word !== undefined) ? ExtendedDictionary.createWordDiscordEmbed(word) : undefined;
    if (embed !== undefined) {
      await interaction.followUp({embeds: [embed]});
    } else {
      await interaction.followUp("kodak e zel atùk.");
    }
  }

  @button("page")
  private async [Symbol()](client: DiscordClient, query: ParsedQuery, interaction: CommandInteraction): Promise<void> {
    let search = query.search! as string;
    let type = query.type! as WordType;
    let page = +query.page!;
    await interaction.defer();
    let dictionary = await ExtendedDictionary.fetch();
    let parameter = new NormalParameter(search, "both", type, "ja", {diacritic: true, case: false});
    let result = dictionary.search(parameter);
    result.sizePerPage = 10;
    if (page >= result.minPage && page <= result.maxPage) {
      let embed = ExtendedDictionary.createSearchResultDiscordEmbed(parameter, result, page);
      let components = ExtendedDictionary.createSearchResultDiscordComponents(parameter, result, page);
      await interaction.followUp({embeds: [embed], components});
    } else {
      await interaction.followUp("kodak e zel atùk.");
    }
  }

  @slash("cipas", "造語依頼を行います。", [
    {name: "name", type: CommandOptionType.STRING, required: true, description: "造語依頼したい訳語"}
  ])
  private async [Symbol()](client: DiscordClient, interaction: CommandInteraction): Promise<void> {
    let name = interaction.options.get("name")!.value! as string;
    await interaction.defer();
    let dictionary = await ExtendedDictionary.fetch();
    await dictionary.addCommissions([name]);
    await interaction.followUp("hafe e'n cipases a'c e xakoc ie sotik!");
  }

  @slash("zelad", "検定チャンネルに投稿された過去の問題を返信します。", [
    {name: "number", type: CommandOptionType.INTEGER, required: true, description: "問題番号"}
  ])
  private async [Symbol()](client: DiscordClient, interaction: CommandInteraction): Promise<void> {
    let number = interaction.options.get("number")!.value! as number;
    await interaction.defer();
    let quiz = await Quiz.findByNumber(client, number);
    if (quiz !== undefined) {
      let embed = quiz.createDiscordEmbed();
      await interaction.followUp({embeds: [embed]});
    } else {
      await interaction.followUp("kotikak a'l e dat.");
    }
  }

  @slash("doklet", "検定チャンネルでの検定のこれまでの成績を返信します。", [
    {name: "user", type: CommandOptionType.USER, required: false, description: "ユーザー (省略時はコマンド実行者)"}
  ])
  private async [Symbol()](client: DiscordClient, interaction: CommandInteraction): Promise<void> {
    let user = interaction.options.get("user")?.user ?? interaction.user;
    await interaction.defer();
    let record = await QuizRecord.fetch(client, user);
    let embed = record.createDiscordEmbed();
    await interaction.followUp({embeds: [embed]});
  }

  @listener("message")
  private async [Symbol()](client: DiscordClient, message: Message): Promise<void> {
    let hasPermission = message.member?.roles.cache.find((role) => role.id === DISCORD_IDS.role.zisvalod) !== undefined;
    if (hasPermission) {
      let match = message.content.match(/^!(?:save)\s+(\d+)$/);
      if (match) {
        let number = +match[1];
        await message.delete();
        await QuizRecord.save(client, number);
        await client.log(`Saved quiz record (number: ${number})`);
      }
    }
  }

  @listener("message")
  private async [Symbol()](client: DiscordClient, message: Message): Promise<void> {
    let hasPermission = message.member?.roles.cache.find((role) => role.id === DISCORD_IDS.role.zisvalod) !== undefined;
    let correctChannel = message.channel.id === DISCORD_IDS.channel.sokad.zelad || message.channel.id === DISCORD_IDS.channel.test;
    if (hasPermission && correctChannel) {
      if (message.content.match(/^\*\*\[\s*(\d+)\s*\]\*\*\s*(☆|★)*\s*\n/)) {
        let matches = message.content.matchAll(/(..\u{20E3}|[\u{1F1E6}-\u{1F1FF}])/gu);
        for (let match of matches) {
          await message.react(match[0]);
        }
      }
    }
  }

}