//

import {
  Client,
  ClientEvents
} from "discord.js";
import "reflect-metadata";
import {
  Controller
} from "/server/discord/controller";


const KEY = Symbol("discord");

type Metadata = Array<{name: string | symbol, event: ClientEventKeys}>;
type ClientEventKeys = keyof ClientEvents;

type ControllerDecorator = (clazz: new() => Controller) => void;
type ListenerMethodDecorator<E extends ClientEventKeys> = (target: object, name: string | symbol, descriptor: TypedPropertyDescriptor<ListenerMethod<E>>) => void;
type ListenerMethod<E extends ClientEventKeys> = (client: Client, ...args: ClientEvents[E]) => any;

export function controller(): ControllerDecorator {
  let decorator = function (clazz: new() => Controller): void {
    let originalSetup = clazz.prototype.setup;
    clazz.prototype.setup = function (this: Controller, client: Client): void {
      let anyThis = this as any;
      let metadata = Reflect.getMetadata(KEY, clazz.prototype) as Metadata;
      for (let {name, event} of metadata) {
        client.on(event, async (...args) => {
          try {
            await anyThis[name](client, ...args);
          } catch (error) {
            this.error(client, "Uncaught error", error);
            console.error(error);
          }
        });
      }
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