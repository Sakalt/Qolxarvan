//

import {
  ApplicationCommandOptionData,
  ClientApplication,
  ClientEvents,
  CommandInteraction
} from "discord.js";
import * as queryParser from "query-string";
import {
  ParsedQuery
} from "query-string";
import "reflect-metadata";
import {
  Controller
} from "/server/discord/controller";
import {
  DISCORD_IDS
} from "/server/discord/id";
import {
  DiscordClient
} from "/server/util/client/discord";


const KEY = Symbol("discord");

type Metadata = Array<ListenerSpec | SlashSpec | ButtonSpec>;
type ClientEventKeys = keyof ClientEvents;
type ListenerSpec = {
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
type ButtonSpec = {
  name: string | symbol,
  commandName: string,
  event: "button"
};

type ControllerDecorator = (clazz: new() => Controller) => void;
type ListenerMethodDecorator<E extends ClientEventKeys> = (target: object, name: string | symbol, descriptor: TypedPropertyDescriptor<ListenerMethod<E>>) => void;
type SlashMethodDecorator = (target: object, name: string | symbol, descriptor: TypedPropertyDescriptor<SlashMethod>) => void;
type ButtonMethodDecorator = (target: object, name: string | symbol, descriptor: TypedPropertyDescriptor<ButtonMethod>) => void;
type ListenerMethod<E extends ClientEventKeys> = (client: DiscordClient, ...args: ClientEvents[E]) => any;
type SlashMethod = (client: DiscordClient, interaction: CommandInteraction) => any;
type ButtonMethod = (client: DiscordClient, query: ParsedQuery, interaction: CommandInteraction) => any;

export function controller(): ControllerDecorator {
  let decorator = function (clazz: new() => Controller): void {
    let originalSetup = clazz.prototype.setup;
    clazz.prototype.setup = async function (this: Controller, client: DiscordClient): Promise<void> {
      let metadata = Reflect.getMetadata(KEY, clazz.prototype) as Metadata;
      setSlash(this, client, metadata);
      registerListener(this, client, metadata);
      registerSlash(this, client, metadata);
      registerButton(this, client, metadata);
      originalSetup(client);
    };
  };
  return decorator;
}

export function listener<E extends ClientEventKeys>(event: E): ListenerMethodDecorator<E> {
  let decorator = function (target: object, name: string | symbol, descriptor: TypedPropertyDescriptor<ListenerMethod<E>>): void {
    let metadata = getMetadata(target);
    metadata.push({name, event});
  };
  return decorator;
}

export function slash(commandName: string, description: string, options?: Array<ApplicationCommandOptionData>): SlashMethodDecorator {
  let decorator = function (target: object, name: string | symbol, descriptor: TypedPropertyDescriptor<SlashMethod>): void {
    let metadata = getMetadata(target);
    metadata.push({name, commandName, description, options, event: "slash"});
  };
  return decorator;
}

export function button(commandName: string): ButtonMethodDecorator {
  let decorator = function (target: object, name: string | symbol, descriptor: TypedPropertyDescriptor<ButtonMethod>): void {
    let metadata = getMetadata(target);
    metadata.push({name, commandName, event: "button"});
  };
  return decorator;
}

function registerListener(controller: any, client: DiscordClient, metadata: Metadata): void {
  let listenerSpecs = metadata.filter((spec) => spec.event !== "slash" && spec.event !== "button") as Array<ListenerSpec>;
  for (let {name, event} of listenerSpecs) {
    client.on(event, async (...args) => {
      try {
        await controller[name](client, ...args);
      } catch (error) {
        client.error("Uncaught error", error);
      }
    });
  }
}

function registerSlash(controller: any, client: DiscordClient, metadata: Metadata): void {
  let slashSpecs = metadata.filter((spec) => spec.event === "slash") as Array<SlashSpec>;
  client.on("interaction", async (interaction) => {
    try {
      if (interaction.isCommand()) {
        let spec = slashSpecs.find((spec) => spec.commandName === interaction.commandName);
        if (spec !== undefined) {
          await controller[spec.name](client, interaction);
        }
      }
    } catch (error) {
      client.error("Uncaught error", error);
    }
  });
}

function registerButton(controller: any, client: DiscordClient, metadata: Metadata): void {
  let buttonSpecs = metadata.filter((spec) => spec.event === "button") as Array<ButtonSpec>;
  client.on("interaction", async (interaction) => {
    try {
      if (interaction.isButton()) {
        let query = queryParser.parse(interaction.customID);
        let spec = buttonSpecs.find((spec) => spec.commandName === query.commandName);
        if (spec !== undefined) {
          await controller[spec.name](client, query, interaction);
        }
      }
    } catch (error) {
      client.error("Uncaught error", error);
    }
  });
}

async function setSlash(controller: any, client: DiscordClient, metadata: Metadata): Promise<void> {
  client.application = new ClientApplication(client, {});
  await client.application.fetch();
  let slashSpecs = metadata.filter((spec) => spec.event === "slash") as Array<SlashSpec>;
  let guild = await client.guilds.fetch(DISCORD_IDS.guild);
  let commands = slashSpecs.map((spec) => ({name: spec.commandName, description: spec.description, options: spec.options}));
  await guild.commands.set(commands);
}

function getMetadata(target: object): Metadata {
  let metadata = Reflect.getMetadata(KEY, target) as Metadata;
  if (!metadata) {
    metadata = [];
    Reflect.defineMetadata(KEY, metadata, target);
  }
  return metadata;
}