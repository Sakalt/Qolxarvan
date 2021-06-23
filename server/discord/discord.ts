//

import {
  formatToTimeZone
} from "date-fns-timezone";
import {
  Message
} from "discord.js";
import {
  NormalParameter
} from "soxsot";
import {
  Controller
} from "/server/discord/controller";
import {
  controller,
  listener
} from "/server/discord/decorator";
import DISCORD_IDS from "/server/discord/id.json";
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
    let date = formatToTimeZone(new Date(), "YYYY/MM/DD HH:mm:ss", {timeZone: "Asia/Tokyo"});
    await client.user?.setPresence({activity: {name: "xalzih", url: "https://github.com/Ziphil/ShaleianOnline"}});
    await this.log(client, `Ready (${date})`);
    console.log("discord ready");
  }

  // 任意のチャンネルの「!sotik (単語)」という投稿に反応して、オンライン辞典から該当単語のエントリーを抽出して投稿します。
  // コマンド名部分を「!sotik」の代わりに「!sotik-detuk」とすると、そのコマンドの投稿が削除されます。
  // 単語はスペース区切りで複数個指定できます。
  @listener("message")
  private async [Symbol()](client: DiscordClient, message: Message): Promise<void> {
    let match = message.content.match(/^!sotik(-detuk)?\s+(.+)$/);
    if (match) {
      let deleteAfter = match[1];
      let names = match[2].trim().split(/\s+/);
      if (deleteAfter) {
        await message.delete();
      }
      let dictionary = await ExtendedDictionary.fetch();
      for (let name of names) {
        let word = dictionary.words.find((word) => word.name === name);
        let embed = (word !== undefined) ? ExtendedDictionary.createWordDiscordEmbed(word) : undefined;
        if (embed !== undefined) {
          await message.channel.send({embed});
        } else {
          await message.channel.send(`kocaqat a sotik adak iva “${name}”.`);
        }
      }
    }
  }

  // 任意のチャンネルの「!palev (単語)」という投稿に反応して、オンライン辞典から検索を行ってその結果を投稿します。
  // コマンド名部分を「!palev」の代わりに「!palev-detuk」とすると、そのコマンドの投稿が削除されます。
  // 検索は、見出し語と訳語の両方から完全一致と前方一致で行われ、完全一致したものが優先的に表示されます。
  @listener("message")
  private async [Symbol()](client: DiscordClient, message: Message): Promise<void> {
    let match = message.content.match(/^!palev(-detuk)?\s+(.+)$/);
    if (match) {
      let deleteAfter = match[1];
      let search = match[2].trim();
      if (deleteAfter) {
        await message.delete();
      }
      let dictionary = await ExtendedDictionary.fetch();
      let exactParameter = new NormalParameter(search, "both", "exact", "ja", {diacritic: false, case: false});
      let prefixParameter = new NormalParameter(search, "both", "prefix", "ja");
      let exactResult = dictionary.search(exactParameter);
      let prefixResult = dictionary.search(prefixParameter);
      let displayedWord = (exactResult.words.length > 0) ? exactResult.words[0] : (prefixResult.words.length > 0) ? prefixResult.words[0] : undefined;
      if (displayedWord !== undefined) {
        let resultEmbed = ExtendedDictionary.createSearchResultDiscordEmbed(prefixParameter, exactResult, prefixResult);
        let wordEmbed = ExtendedDictionary.createWordDiscordEmbed(displayedWord);
        await message.channel.send(`kotikak a'l e sotik al'${prefixResult.words.length}. cafosis a'l e met acates.`);
        await message.channel.send({embed: resultEmbed});
        await message.channel.send({embed: wordEmbed});
      } else {
        await message.channel.send("kotikak a'l e sotik adak.");
      }
    }
  }

  // 任意のチャンネルの「!cipas (訳語)」という投稿に反応して、その訳語の造語依頼をします。
  // コマンド名部分を「!cipas」の代わりに「!cipas-detuk」とすると、そのコマンドの投稿が削除されます。
  // 訳語はスペース区切りで複数個指定できます。
  @listener("message")
  private async [Symbol()](client: DiscordClient, message: Message): Promise<void> {
    let match = message.content.match(/^!cipas(-detuk)?\s+(.+)$/);
    if (match) {
      let deleteAfter = match[1];
      let names = match[2].trim().split(/\s+/);
      if (deleteAfter) {
        await message.delete();
      }
      let dictionary = await ExtendedDictionary.fetch();
      await dictionary.addCommissions(names);
      await message.channel.send("hafe e'n cipases a'c e xakoc ie sotik.");
    }
  }

  // 任意のチャンネルの「!zelad (番号)」という投稿に反応して、検定チャンネルの該当番号の解説投稿を検索し、その内容を整形して投稿します。
  // コマンド名部分を「!zelad」の代わりに「!zelad-detuk」とすると、そのコマンドの投稿が削除されます。
  @listener("message")
  private async [Symbol()](client: DiscordClient, message: Message): Promise<void> {
    let match = message.content.match(/^!zelad(-detuk)?\s+(\d+)$/);
    if (match) {
      let deleteAfter = match[1];
      let number = +match[2];
      if (deleteAfter) {
        await message.delete();
      }
      let quiz = await Quiz.findByNumber(client, number);
      if (quiz !== undefined) {
        let embed = quiz.createDiscordEmbed();
        await message.channel.send({embed});
      } else {
        await message.channel.send("kodat e zel atùk.");
      }
    }
  }

  // 任意のチャンネルの「!doklet」という投稿に反応して、その投稿をしたユーザーのクイズの成績を整形して投稿します。
  // コマンド名部分を「!doklet」の代わりに「!doklet-detuk」とすると、そのコマンドの投稿が削除されます。
  @listener("message")
  private async [Symbol()](client: DiscordClient, message: Message): Promise<void> {
    let match = message.content.match(/^!doklet(-detuk)?(?:\s+(\d+))?$/);
    if (match) {
      let deleteAfter = match[1];
      let userId = match[2];
      if (deleteAfter) {
        await message.delete();
      }
      let user = (userId) ? await client.users.fetch(userId) : message.author;
      let record = await QuizRecord.fetch(client, user);
      let embed = record.createEmbed();
      await message.channel.send({embed});
    }
  }

  @listener("message")
  private async [Symbol()](client: DiscordClient, message: Message): Promise<void> {
    let hasPermission = message.member?.roles.cache.find((role) => role.id === DISCORD_IDS.role.zisvalod) !== undefined;
    if (hasPermission) {
      let match = message.content.match(/^!save\s+(\d+)$/);
      if (match) {
        let number = +match[1];
        await message.delete();
        await QuizRecord.save(client, number);
        await this.log(client, `Successfully saved: ${number}`);
      }
    }
  }

  // 検定チャンネルに問題が投稿されたときに、投稿文中に含まれている選択肢の絵文字のリアクションを自動的に付けます。
  // 選択肢として使える絵文字は、数字もしくはラテン文字の絵文字のみです。
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