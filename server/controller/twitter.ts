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
  DictionaryUtils
} from "/server/util/dictionary";
import {
  TwitterUtils
} from "/server/util/twitter";


@controller("/api/twitter")
export class TwitterController extends Controller {

  @cron("*/15 * * * *")
  public async [Symbol()](): Promise<void> {
    let text = await DictionaryUtils.fetchTwitterText();
    await TwitterUtils.tweet(text);
  }

}