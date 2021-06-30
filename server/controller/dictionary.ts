//

import cors from "cors";
import {
  TextChannel
} from "discord.js";
import {
  Request,
  Response
} from "express";
import fs from "fs";
import {
  SaverCreator
} from "soxsot/dist/io";
import {
  Controller
} from "/server/controller/controller";
import {
  before,
  controller,
  cron,
  get,
  post
} from "/server/controller/decorator";
import {
  DISCORD_IDS
} from "/server/discord/id";
import {
  DiscordClient,
  TwitterClient
} from "/server/util/client";
import {
  ExtendedDictionary
} from "/server/util/dictionary";
import {
  getTempFilePath
} from "/server/util/misc";
import * as val from "/server/util/validator/builtin-validators";
import {
  PASSWORD
} from "/server/variable";


@controller("/api/dictionary")
export class DictionaryController extends Controller {

  @get("/fetch")
  public async [Symbol()](request: Request, response: Response): Promise<void> {
    let dictionary = await ExtendedDictionary.fetch();
    let plainDictionary = dictionary.toPlain();
    response.json(plainDictionary).end();
  }

  @post("/upload")
  public async [Symbol()](request: Request, response: Response): Promise<void> {
    let validator = val.object({
      password: val.string
    });
    let [body, invalids] = validator.validate(request.body);
    if (body !== undefined && request.file?.path !== undefined) {
      if (body.password === PASSWORD) {
        let path = request.file?.path;
        let dictionary = await ExtendedDictionary.upload(path);
        let twitterPromise = TwitterClient.instance.tweet(`◆ 辞書データが更新されました (${dictionary.words.length} 語)。`);
        let discordPromise = (async () => {
          let channel = DiscordClient.instance.channels.resolve(DISCORD_IDS.channel.sokad.sotik);
          if (channel instanceof TextChannel) {
            await channel.send(`辞書データが更新されました (${dictionary.words.length} 語)。`);
          }
        })();
        await Promise.all([twitterPromise, discordPromise]);
        await fs.promises.unlink(path);
        response.json(null).end();
      } else {
        response.sendStatus(403).end();
      }
    } else {
      response.status(400).json(invalids).end();
    }
  }

  @get("/download")
  public async [Symbol()](request: Request, response: Response): Promise<void> {
    let validator = val.object({
      kind: val.enums("single", "oldShaleian")
    });
    let [query, invalids] = validator.validate(request.query);
    if (query !== undefined) {
      let path = getTempFilePath("txt");
      let fileName = "shaleian" + ((query.kind === "single") ? ".xdn" : ".xdc");
      let dictionary = await ExtendedDictionary.fetch();
      let saver = SaverCreator.createByKind(query.kind, dictionary, path);
      await saver.asPromise();
      response.download(path, fileName, (error) => {
        fs.promises.unlink(path);
      });
    } else {
      response.status(400).json(invalids).end();
    }
  }

  @post("/request")
  @before(cors())
  public async [Symbol()](request: Request, response: Response): Promise<void> {
    let validator = val.object({
      names: val.array(val.string)
    });
    let [body, invalids] = validator.validate(request.body);
    if (body !== undefined) {
      let dictionary = await ExtendedDictionary.fetch();
      let count = await dictionary.addCommissions(body.names);
      response.json(count).end();
    } else {
      response.status(400).json(invalids).end();
    }
  }

  @get("/count")
  @before(cors())
  public async [Symbol()](request: Request, response: Response): Promise<void> {
    let dictionary = await ExtendedDictionary.fetch();
    let count = dictionary.words.length;
    response.json(count).end();
  }

  @get("/difference")
  @before(cors())
  public async [Symbol()](request: Request, response: Response): Promise<void> {
    let validator = val.object({
      durations: val.arrayOrSingle(val.intFromString)
    });
    let [query, invalids] = validator.validate(request.query);
    if (query !== undefined) {
      let dictionary = await ExtendedDictionary.fetch();
      let difference = await dictionary.fetchWordCountDifferences(query.durations);
      response.json(difference).end();
    } else {
      response.status(400).json(invalids).end();
    }
  }

  @get("/badge/count")
  @before(cors())
  public async [Symbol()](request: Request, response: Response): Promise<void> {
    let dictionary = await ExtendedDictionary.fetch();
    let count = dictionary.words.length;
    let output = {schemaVersion: 1, color: "informational", label: "words", message: count.toString()};
    response.json(output).end();
  }

  @cron("*/30 * * * *")
  public async [Symbol()](): Promise<void> {
    let dictionary = await ExtendedDictionary.fetch();
    await dictionary.saveHistory();
  }

  @cron("*/15 * * * *")
  public async [Symbol()](): Promise<void> {
    let dictionary = await ExtendedDictionary.fetch();
    let word = dictionary.words[Math.floor(Math.random() * dictionary.words.length)];
    let text = ExtendedDictionary.createWordTwitterText(word);
    if (text !== undefined) {
      await TwitterClient.instance.tweet(text);
    }
  }

  @cron("*/30 * * * *")
  public async [Symbol()](): Promise<void> {
    let dictionary = await ExtendedDictionary.fetch();
    let word = dictionary.words[Math.floor(Math.random() * dictionary.words.length)];
    let embed = ExtendedDictionary.createWordDiscordEmbed(word);
    if (embed !== undefined) {
      let channel = DiscordClient.instance.channels.resolve(DISCORD_IDS.channel.sokad.sotik);
      if (channel instanceof TextChannel) {
        await channel.send({embeds: [embed]});
      } else {
        throw new Error("cannot happen");
      }
    }
  }

}