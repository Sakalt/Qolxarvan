//

import {
  Snowflake
} from "discord.js";
import JSON_DISCORD_IDS from "/server/discord/id.json";


export const DISCORD_IDS = JSON_DISCORD_IDS as DiscordIds;

export type DiscordIds = DeepToSnowflake<typeof JSON_DISCORD_IDS>;
type ToSnowflake<S> = S extends string ? Snowflake : S;
type DeepToSnowflake<T> = T extends object ? {[K in keyof T]: DeepToSnowflake<T[K]>} : ToSnowflake<T>;