//

import {
  TextChannel
} from "discord.js";
import {
  Request,
  Response
} from "express";
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
  DiscordClient
} from "/server/util/client";
import {
  ExtendedDictionary
} from "/server/util/dictionary";


@controller("/api/discord")
export class DiscordController extends Controller {

  @cron("*/30 * * * *")
  public async [Symbol()](): Promise<void> {
    let dictionary = await ExtendedDictionary.fetch();
    let embed = dictionary.createDiscordEmbed();
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