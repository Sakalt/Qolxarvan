//

import {
  ApplicationCommandOptionData,
  Client,
  ClientApplication,
  ClientEvents,
  CommandInteraction
} from "discord.js";
import "reflect-metadata";
import {
  Controller
} from "/server/discord/controller";
import {
  DISCORD_IDS
} from "/server/discord/id";


const KEY = Symbol("discord");

type Metadata = Array<ClientEventSpec | SlashSpec>;
type ClientEventSpec = {
  name: string | symbol,
  event: ClientEventKeys
};
type SlashSpec = {
  name: string | symbol,
  commandName: string,
  description: string,
  options?: Array<ApplicationCommandOptionData>,
  event: "slash"
};
type ClientEventKeys = keyof ClientEvents;

type ControllerDecorator = (clazz: new() => Controller) => void;
type ListenerMethodDecorator<E extends ClientEventKeys> = (target: object, name: string | symbol, descriptor: TypedPropertyDescriptor<ListenerMethod<E>>) => void;
type SlashMethodDecorator = (target: object, name: string | symbol, descriptor: TypedPropertyDescriptor<SlashMethod>) => void;
type ListenerMethod<E extends ClientEventKeys> = (client: Client, ...args: ClientEvents[E]) => any;
type SlashMethod = (client: Client, interaction: CommandInteraction) => any;

export function controller(): ControllerDecorator {
  let decorator = function (clazz: new() => Controller): void {
    let originalSetup = clazz.prototype.setup;
    clazz.prototype.setup = async function (this: Controller, client: Client): Promise<void> {
      let anyThis = this as any;
      let metadata = Reflect.getMetadata(KEY, clazz.prototype) as Metadata;
      for (let {name, event} of metadata) {
        if (event !== "slash") {
          client.on(event, async (...args) => {
            try {
              await anyThis[name](client, ...args);
            } catch (error) {
              this.error(client, "Uncaught error", error);
              console.error(error);
            }
          });
        }
      }
      let slashSpecs = metadata.filter((spec) => spec.event === "slash") as Array<SlashSpec>;
      client.application = new ClientApplication(client, {});
      await client.application.fetch();
      let guild = await client.guilds.fetch(DISCORD_IDS.guild);
      let commands = slashSpecs.map((spec) => ({name: spec.commandName, description: spec.description, options: spec.options}));
      guild.commands.set(commands).then(() => {
        console.log("command defined");
      });
      client.on("interaction", async (interaction) => {
        try {
          if (interaction.isCommand()) {
            let spec = slashSpecs.find((spec) => spec.commandName === interaction.commandName);
            if (spec !== undefined) {
              await anyThis[spec.name](client, interaction);
            }
          }
        } catch (error) {
          this.error(client, "Uncaught error", error);
          console.error(error);
        }
      });
      originalSetup(client);
    };
  };
  return decorator;
}

export function listener<E extends ClientEventKeys>(event: E): ListenerMethodDecorator<E> {
  let decorator = function (target: object, name: string | symbol, descriptor: TypedPropertyDescriptor<ListenerMethod<E>>): void {
    let metadata = Reflect.getMetadata(KEY, target) as Metadata;
    if (!metadata) {
      metadata = [];
      Reflect.defineMetadata(KEY, metadata, target);
    }
    metadata.push({name, event});
  };
  return decorator;
}

export function slash(commandName: string, description: string, options?: Array<ApplicationCommandOptionData>): SlashMethodDecorator {
  let decorator = function (target: object, name: string | symbol, descriptor: TypedPropertyDescriptor<SlashMethod>): void {
    let metadata = Reflect.getMetadata(KEY, target) as Metadata;
    if (!metadata) {
      metadata = [];
      Reflect.defineMetadata(KEY, metadata, target);
    }
    metadata.push({name, commandName, description, options, event: "slash"});
  };
  return decorator;
}