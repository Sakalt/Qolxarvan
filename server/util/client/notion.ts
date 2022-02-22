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
    let client = new OriginalNotionClient({auth: NOTION_KEY}) as any;
    Object.setPrototypeOf(client, NotionClient.prototype);
    return client;
  }

  public async addPage(databaseId: string, properties: Array<{name: string, data: any}>): Promise<void> {
    let parentJson = {"database_id": databaseId};
    let propertiesJson = Object.fromEntries(properties.map((property) => [property.name, property.data]));
    let json = {"parent": parentJson, "properties": propertiesJson};
    await NotionClient.instance.pages.create(json);
  }

}


export class NotionData {

  public static createTitle(richTextItems: Array<any>): any {
    let json = {
      "type": "title",
      "title": richTextItems
    };
    return json;
  }

  public static createRichText(richTextItems: Array<any>): any {
    let json = {
      "type": "rich_text",
      "rich_text": richTextItems
    };
    return json;
  }

  public static createDate(start: Date, end?: Date | null): any {
    let timeZone = "Asia/Tokyo";
    let startString = formatToTimeZone(start, "YYYY-MM-DD[T]HH:mm:ssZ", {timeZone});
    let endString = (end) ? formatToTimeZone(end, "YYYY-MM-DD[T]HH:mm:ssZ", {timeZone}) : null;
    let json = {
      "type": "date",
      "date": {"start": startString, "end": endString}
    };
    return json;
  }

  public static createCheckbox(checked: boolean): any {
    let json = {
      "type": "checkbox",
      "checkbox": checked
    };
    return json;
  }

  public static createRichTextItem(content: string, annotations?: RichTextItemAnnotations): any {
    let json = {
      "type": "text",
      "text": {"content": content},
      "annotations": annotations ?? {}
    };
    return json;
  }

}


export type RichTextItemAnnotations = {bold?: boolean, italic?: boolean, strikethrough?: boolean, underline?: boolean, code?: boolean, color?: string};