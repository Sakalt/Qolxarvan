/* eslint @typescript-eslint/naming-convention: off, quote-props: off, object-shorthand: off */

import {
  Client as OriginalNotionClient
} from "@notionhq/client";
import {
  formatToTimeZone
} from "date-fns-timezone";
import {
  NOTION_KEY
} from "/server/variable";


export class NotionClient extends OriginalNotionClient {

  public static readonly instance: NotionClient = NotionClient.create();

  public static create(): NotionClient {
    const client = new OriginalNotionClient({auth: NOTION_KEY}) as any;
    Object.setPrototypeOf(client, NotionClient.prototype);
    return client;
  }

  public async addPage(databaseId: string, properties: Array<{name: string, data: any}>): Promise<void> {
    const parentJson = {"database_id": databaseId};
    const propertiesJson = Object.fromEntries(properties.map((property) => [property.name, property.data]));
    const json = {"parent": parentJson, "properties": propertiesJson};
    await NotionClient.instance.pages.create(json);
  }

}


export class NotionData {

  public static createTitle(richTextItems: Array<any>): any {
    const json = {
      "type": "title",
      "title": richTextItems
    };
    return json;
  }

  public static createRichText(richTextItems: Array<any>): any {
    const json = {
      "type": "rich_text",
      "rich_text": richTextItems
    };
    return json;
  }

  public static createDate(start: Date, end?: Date | null): any {
    const timeZone = "Asia/Tokyo";
    const startString = formatToTimeZone(start, "YYYY-MM-DD[T]HH:mm:ssZ", {timeZone});
    const endString = (end) ? formatToTimeZone(end, "YYYY-MM-DD[T]HH:mm:ssZ", {timeZone}) : null;
    const json = {
      "type": "date",
      "date": {"start": startString, "end": endString}
    };
    return json;
  }

  public static createCheckbox(checked: boolean): any {
    const json = {
      "type": "checkbox",
      "checkbox": checked
    };
    return json;
  }

  public static createRichTextItem(content: string, annotations?: RichTextItemAnnotations): any {
    const json = {
      "type": "text",
      "text": {"content": content},
      "annotations": annotations ?? {}
    };
    return json;
  }

}


export type RichTextItemAnnotations = {bold?: boolean, italic?: boolean, strikethrough?: boolean, underline?: boolean, code?: boolean, color?: string};