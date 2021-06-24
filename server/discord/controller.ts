//

import {
  TextChannel
} from "discord.js";
import {
  DISCORD_IDS
} from "/server/discord/id";
import {
  DiscordClient
} from "/server/util/client/discord";


export class Controller {

  private setup(client: DiscordClient): void {
  }

  protected async log(client: DiscordClient, message: string): Promise<void> {
    try {
      let channel = client.channels.resolve(DISCORD_IDS.channel.bot);
      if (channel instanceof TextChannel) {
        await channel.send(message);
      } else {
        throw new Error("cannot happen");
      }
    } catch (error) {
      console.error(error);
    }
  }

  protected async error(client: DiscordClient, message: string, error: Error): Promise<void> {
    try {
      let channel = client.channels.resolve(DISCORD_IDS.channel.bot);
      if (channel instanceof TextChannel) {
        let nextMessage = message + "\n```\n" + error.stack + "```";
        await channel.send(nextMessage);
      } else {
        throw new Error("cannot happen");
      }
    } catch (error) {
      console.error(error);
    }
  }

  public static setup<C extends Controller>(this: new() => C, client: DiscordClient): C {
    let controller = new this();
    controller.setup(client);
    return controller;
  }

}