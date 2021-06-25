//

import OriginalTwitterClient from "twitter";
import {
  ResponseData
} from "twitter";
import {
  TWITTER_ACCESS_KEY,
  TWITTER_ACCESS_SECRET,
  TWITTER_KEY,
  TWITTER_SECRET
} from "/server/variable";


export class TwitterClient extends OriginalTwitterClient {

  public static readonly instance: TwitterClient = TwitterClient.create();

  public static create(): TwitterClient {
    let options = Object.fromEntries([
      ["consumer_key", TWITTER_KEY],
      ["consumer_secret", TWITTER_SECRET],
      ["access_token_key", TWITTER_ACCESS_KEY],
      ["access_token_secret", TWITTER_ACCESS_SECRET]
    ]) as any;
    let client = new TwitterClient(options);
    return client;
  }

  public async tweet(text: string): Promise<ResponseData> {
    let response = await this.post("statuses/update", {status: text});
    return response;
  }

}