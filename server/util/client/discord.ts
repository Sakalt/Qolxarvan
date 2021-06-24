//

import {
  Intents,
  Client as OriginalDiscordClient
} from "discord.js";
import {
  DISCORD_KEY
} from "/server/variable";


export class DiscordClient extends OriginalDiscordClient {

  public static instance: DiscordClient = DiscordClient.create();

  private static create(): DiscordClient {
    let client = new OriginalDiscordClient({intents: Intents.ALL}) as any;
    Object.setPrototypeOf(client, DiscordClient.prototype);
    client.login(DISCORD_KEY);
    return client;
  }

}