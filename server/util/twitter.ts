//

import Twitter from "twitter";
import {
  ResponseData
} from "twitter";
import {
  TWITTER_ACCESS_KEY,
  TWITTER_ACCESS_SECRET,
  TWITTER_KEY,
  TWITTER_SECRET
} from "/server/variable";


export class TwitterUtils {

  public static async tweet(text: string): Promise<ResponseData> {
    let client = TwitterUtils.createClient();
    let response = await client.post("statuses/update", {status: text});
    return response;
  }

  private static createClient(): Twitter {
    let options = Object.fromEntries([
      ["consumer_key", TWITTER_KEY],
      ["consumer_secret", TWITTER_SECRET],
      ["access_token_key", TWITTER_ACCESS_KEY],
      ["access_token_secret", TWITTER_ACCESS_SECRET]
    ]);
    let client = new Twitter(options);
    return client;
  }

}