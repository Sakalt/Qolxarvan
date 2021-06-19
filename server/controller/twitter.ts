//

import {
  Request,
  Response
} from "express";
import {
  Controller
} from "/server/controller/controller";
import {
  before,
  controller,
  cron,
  get,
  post
} from "/server/controller/decorator";
import {
  TwitterClient
} from "/server/util/client";
import {
  DictionaryUtils
} from "/server/util/dictionary";


@controller("/api/twitter")
export class TwitterController extends Controller {

  @cron("*/15 * * * *")
  public async [Symbol()](): Promise<void> {
    let text = await DictionaryUtils.fetchTwitterText();
    await TwitterClient.instance.tweet(text);
  }

}