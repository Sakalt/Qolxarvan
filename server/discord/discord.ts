//

import {
  ApplicationCommandOptionType as CommandOptionType
} from "discord-api-types";
import {
  ButtonInteraction,
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
    const url = "https://github.com/Ziphil/ShaleianOnline";
    const presence = client.user?.setPresence({activities: [{name: "xalzih", url}]});
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
    const name = interaction.options.get("name")!.value! as string;
    const dictionary = await ExtendedDictionary.fetch();
    const word = dictionary.words.find((word) => word.name === name);
    const embed = (word !== undefined) ? ExtendedDictionary.createWordDiscordEmbed(word) : undefined;
    if (embed !== undefined) {
      await interaction.reply({embeds: [embed]});
    } else {
      await interaction.reply(`kocaqat a sotik adak iva “${name}”.`);
    }
  }

  @slash("palev", "オンライン辞典から検索 (見出し語と訳語の両方から) を行ってその結果を返信します。", [
    {name: "search", type: CommandOptionType.STRING, required: true, description: "検索する内容"},
    {name: "part", type: CommandOptionType.BOOLEAN, required: false, description: "部分一致にするかどうか (True: 部分一致, False: 完全一致)"}
  ])
  private async [Symbol()](client: DiscordClient, interaction: CommandInteraction): Promise<void> {
    const search = interaction.options.get("search")?.value as string;
    const part = interaction.options.get("part")?.value as boolean | undefined;
    await interaction.defer();
    const dictionary = await ExtendedDictionary.fetch();
    const parameter = new NormalParameter(search, "both", (part) ? "part" : "exact", "ja", {diacritic: true, case: false});
    const result = dictionary.search(parameter);
    result.sizePerPage = 10;
    if (result.words.length > 0) {
      const embed = ExtendedDictionary.createSearchResultDiscordEmbed(parameter, result, 0);
      const components = ExtendedDictionary.createSearchResultDiscordComponents(parameter, result, 0);
      const count = result.words.length;
      await interaction.followUp({content: `kotikak a'l e sotik al'${count}.`, embeds: [embed], components});
    } else {
      const embed = ExtendedDictionary.createSearchResultDiscordEmbed(parameter, result, 0);
      await interaction.followUp({content: "kotikak a'l e sotik adak.", embeds: [embed]});
    }
  }

  @button("word")
  private async [Symbol()](client: DiscordClient, query: ParsedQuery, interaction: ButtonInteraction): Promise<void> {
    const uniqueName = query.uniqueName! as string;
    await interaction.defer();
    const dictionary = await ExtendedDictionary.fetch();
    const word = dictionary.findByUniqueName(uniqueName);
    const embed = (word !== undefined) ? ExtendedDictionary.createWordDiscordEmbed(word) : undefined;
    if (embed !== undefined) {
      await interaction.followUp({embeds: [embed]});
    } else {
      await interaction.followUp("kodak e zel atùk.");
    }
  }

  @button("page")
  private async [Symbol()](client: DiscordClient, query: ParsedQuery, interaction: ButtonInteraction): Promise<void> {
    const search = query.search! as string;
    const type = query.type! as WordType;
    const page = +query.page!;
    await interaction.defer();
    const dictionary = await ExtendedDictionary.fetch();
    const parameter = new NormalParameter(search, "both", type, "ja", {diacritic: true, case: false});
    const result = dictionary.search(parameter);
    result.sizePerPage = 10;
    if (page >= result.minPage && page <= result.maxPage) {
      const embed = ExtendedDictionary.createSearchResultDiscordEmbed(parameter, result, page);
      const components = ExtendedDictionary.createSearchResultDiscordComponents(parameter, result, page);
      await interaction.followUp({embeds: [embed], components});
    } else {
      await interaction.followUp("kodak e zel atùk.");
    }
  }

  @slash("cipas", "造語依頼を行います。", [
    {name: "name", type: CommandOptionType.STRING, required: true, description: "造語依頼したい訳語"}
  ])
  private async [Symbol()](client: DiscordClient, interaction: CommandInteraction): Promise<void> {
    const name = interaction.options.get("name")!.value! as string;
    await interaction.defer();
    const dictionary = await ExtendedDictionary.fetch();
    await dictionary.addCommissions([name]);
    await interaction.followUp("hafe e'n cipases a'c e xakoc ie sotik!");
  }

  @slash("zelad", "検定チャンネルに投稿された過去の問題を返信します。", [
    {name: "number", type: CommandOptionType.INTEGER, required: true, description: "問題番号"}
  ])
  private async [Symbol()](client: DiscordClient, interaction: CommandInteraction): Promise<void> {
    const number = interaction.options.get("number")!.value! as number;
    await interaction.defer();
    const quiz = await Quiz.findByNumber(client, number);
    if (quiz !== undefined) {
      const embed = quiz.createDiscordEmbed();
      await interaction.followUp({embeds: [embed]});
    } else {
      await interaction.followUp("kotikak a'l e dat.");
    }
  }

  @slash("doklet", "検定チャンネルでの検定のこれまでの成績を返信します。", [
    {name: "user", type: CommandOptionType.USER, required: false, description: "ユーザー (省略時はコマンド実行者)"}
  ])
  private async [Symbol()](client: DiscordClient, interaction: CommandInteraction): Promise<void> {
    const user = interaction.options.get("user")?.user ?? interaction.user;
    await interaction.defer();
    const record = await QuizRecord.fetch(client, user);
    const embed = record.createDiscordEmbed();
    await interaction.followUp({embeds: [embed]});
  }

  @listener("message")
  private async [Symbol()](client: DiscordClient, message: Message): Promise<void> {
    const hasPermission = message.member?.roles.cache.find((role) => role.id === DISCORD_IDS.role.zisvalod) !== undefined;
    if (hasPermission) {
      const match = message.content.match(/^!(?:save)\s+(\d+)$/);
      if (match) {
        const number = +match[1];
        await message.delete();
        await QuizRecord.save(client, number);
        await client.log(`Saved quiz record (number: ${number})`);
      }
    }
  }

  @listener("message")
  private async [Symbol()](client: DiscordClient, message: Message): Promise<void> {
    const hasPermission = message.member?.roles.cache.find((role) => role.id === DISCORD_IDS.role.zisvalod) !== undefined;
    const correctChannel = message.channel.id === DISCORD_IDS.channel.sokad.zelad || message.channel.id === DISCORD_IDS.channel.test;
    if (hasPermission && correctChannel) {
      if (message.content.match(/^\*\*\[\s*(\d+)\s*\]\*\*\s*(☆|★)*\s*\n/)) {
        const matches = message.content.matchAll(/(..\u{20E3}|[\u{1F1E6}-\u{1F1FF}])/gu);
        for (const match of matches) {
          await message.react(match[0]);
        }
      }
    }
  }

}