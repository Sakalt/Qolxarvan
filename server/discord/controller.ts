//

import {
  DiscordClient
} from "/server/util/client/discord";


export class Controller {

  private async setup(client: DiscordClient): Promise<void> {
  }

  public static setup<C extends Controller>(this: new() => C, client: DiscordClient): C {
    let controller = new this();
    controller.setup(client);
    return controller;
  }

}