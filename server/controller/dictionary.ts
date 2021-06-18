//

import {
  Request,
  Response
} from "express";
import fs from "fs";
import {
  nanoid
} from "nanoid";
import {
  SaverCreator,
  SaverKind
} from "soxsot/dist/io";
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


@controller("/api/dictionary")
export class DictionaryController extends Controller {

  @get("/fetch")
  public async [Symbol()](request: Request, response: Response): Promise<void> {
    let dictionary = await GoogleUtils.fetchDictionary();
    let plainDictionary = dictionary.toPlain();
    response.json(plainDictionary).end();
  }

  @get("/download")
  public async [Symbol()](request: Request, response: Response): Promise<void> {
    if (request.query.kind === "single" || request.query.kind === "oldShaleian") {
      let kind = request.query.kind as SaverKind;
      let path = `./dist/temp/temp-${nanoid()}.xdn`;
      let fileName = "shaleian" + ((kind === "single") ? ".xdn" : ".xdc");
      let dictionary = await GoogleUtils.fetchDictionary();
      let saver = SaverCreator.createByKind(kind, dictionary, path);
      await saver.asPromise();
      response.download(path, fileName);
      fs.promises.unlink(path);
    } else {
      response.sendStatus(400).end();
    }
  }

}