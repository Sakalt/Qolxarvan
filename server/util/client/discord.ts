//

import {
  formatToTimeZone
} from "date-fns-timezone";
import {
  Intents,
  Client as OriginalDiscordClient,
  TextChannel
} from "discord.js";
import {
  DISCORD_IDS
} from "/server/discord/id";
import {
  DISCORD_KEY
} from "/server/variable";


export class DiscordClient extends OriginalDiscordClient {

  public static readonly instance: DiscordClient = DiscordClient.create();

  private static create(): DiscordClient {
    const client = new OriginalDiscordClient({intents: Intents.ALL}) as any;
    Object.setPrototypeOf(client, DiscordClient.prototype);
    client.login(DISCORD_KEY);
    return client;
  }

  public async log(message: string): Promise<void> {
    try {
      const channel = this.channels.resolve(DISCORD_IDS.channel.bot);
      if (channel instanceof TextChannel) {
        const date = formatToTimeZone(new Date(), "YYYY/MM/DD HH:mm:ss", {timeZone: "Asia/Tokyo"});
        const nextMessage = `__${date}__\n${message}`;
        await channel.send(nextMessage);
      } else {
        throw new Error("cannot happen");
      }
    } catch (error) {
      console.error(error);
    }
  }

  public async error(message: string, error: Error): Promise<void> {
    try {
      const channel = this.channels.resolve(DISCORD_IDS.channel.bot);
      if (channel instanceof TextChannel) {
        const date = formatToTimeZone(new Date(), "YYYY/MM/DD HH:mm:ss", {timeZone: "Asia/Tokyo"});
        const nextMessage = `__${date}__\n${message}\n\`\`\`\n${error.stack}\`\`\``;
        await channel.send(nextMessage);
      } else {
        throw new Error("cannot happen");
      }
    } catch (error) {
      console.error(error);
    }
  }

}