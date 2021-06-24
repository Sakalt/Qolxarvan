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
  nanoid
} from "nanoid";
import {
  SaverCreator,
  SaverKind
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
import DISCORD_IDS from "/server/discord/id.json";
import {
  DiscordClient,
  TwitterClient
} from "/server/util/client";
import {
  ExtendedDictionary
} from "/server/util/dictionary";
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
    let password = request.body.password;
    let path = request.file?.path;
    if (password === PASSWORD && path !== undefined) {
      let dictionary = await ExtendedDictionary.upload(path);
      await TwitterClient.instance.tweet(`◆ 辞書データが更新されました (${dictionary.words.length} 語)。`);
      await fs.promises.unlink(path);
      response.json(null).end();
    } else {
      response.sendStatus(400).end();
    }
  }

  @get("/download")
  public async [Symbol()](request: Request, response: Response): Promise<void> {
    if (request.query.kind === "single" || request.query.kind === "oldShaleian") {
      let kind = request.query.kind as SaverKind;
      let path = `./dist/temp/temp-${nanoid()}.xdn`;
      let fileName = "shaleian" + ((kind === "single") ? ".xdn" : ".xdc");
      let dictionary = await ExtendedDictionary.fetch();
      let saver = SaverCreator.createByKind(kind, dictionary, path);
      await saver.asPromise();
      response.download(path, fileName, (error) => {
        fs.promises.unlink(path);
      });
    } else {
      response.sendStatus(400).end();
    }
  }

  @post("/request")
  @before(cors())
  public async [Symbol()](request: Request, response: Response): Promise<void> {
    let names = (() => {
      if (Array.isArray(request.body.names)) {
        let rawNames = request.body.names as Array<any>;
        if (rawNames.every((name) => typeof name === "string")) {
          return rawNames as Array<string>;
        }
      } else {
        return undefined;
      }
    })();
    if (names !== undefined) {
      let dictionary = await ExtendedDictionary.fetch();
      let count = await dictionary.addCommissions(names);
      response.json(count).end();
    } else {
      response.sendStatus(400).end();
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
    let durations = (() => {
      let rawDurations = request.query.durations as any;
      if (typeof rawDurations === "string") {
        return [+rawDurations];
      } else if (Array.isArray(rawDurations) && rawDurations.every((element) => typeof element === "string")) {
        return rawDurations.map((element) => +element);
      } else {
        return undefined;
      }
    })();
    if (durations !== undefined) {
      let dictionary = await ExtendedDictionary.fetch();
      let difference = await dictionary.fetchWordCountDifferences(durations);
      response.json(difference).end();
    } else {
      response.sendStatus(400).end();
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
    console.log("history saved");
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
        await channel.send({embed});
        console.log("discord post");
      } else {
        throw new Error("cannot happen");
      }
    }
  }

}