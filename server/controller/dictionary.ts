//

import {
  Request,
  Response
} from "express";
import {
  Controller
} from "/server/controller/controller";
import {
  controller,
  get,
  post
} from "/server/controller/decorator";
import {
  GoogleUtils
} from "/server/util/google";
import {
  DICTIONARY_ID
} from "/server/variable";


@controller("/api/dictionary")
export class DictionaryController extends Controller {

  @get("/fetch")
  public async [Symbol()](request: Request, response: Response): Promise<void> {
    let stream = await GoogleUtils.downloadFile(DICTIONARY_ID);
    stream.pipe(response);
  }

}