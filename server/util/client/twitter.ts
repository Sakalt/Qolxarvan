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
    const options = Object.fromEntries([
      ["consumer_key", TWITTER_KEY],
      ["consumer_secret", TWITTER_SECRET],
      ["access_token_key", TWITTER_ACCESS_KEY],
      ["access_token_secret", TWITTER_ACCESS_SECRET]
    ]) as any;
    const client = new TwitterClient(options);
    return client;
  }

  public async tweet(text: string): Promise<ResponseData> {
    const response = await this.post("statuses/update", {status: text});
    return response;
  }

}