//

import {
  Request,
  Response
} from "express";
import fs from "fs";
import {
  SingleLoader
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
import {
  DICTIONARY_ID
} from "/server/variable";


@controller("/api/dictionary")
export class DictionaryController extends Controller {

  @get("/fetch")
  public async [Symbol()](request: Request, response: Response): Promise<void> {
    let stream = await GoogleUtils.downloadFile(DICTIONARY_ID);
    let path = "./dist/temp/temp.xdn";
    let fileStream = fs.createWriteStream(path, {encoding: "utf-8"});
    stream.on("data", (chunk) => {
      fileStream.write(chunk);
    });
    stream.on("end", async () => {
      fileStream.end();
      let loader = new SingleLoader(path);
      let dictionary = await loader.asPromise();
      let plainDictionary = dictionary.toPlain();
      response.json(plainDictionary).end();
    });
    stream.on("error", (error) => {
      console.error(error);
      response.sendStatus(500).end();
    });
  }

  @get("/download")
  public async [Symbol()](request: Request, response: Response): Promise<void> {
    let stream = await GoogleUtils.downloadFile(DICTIONARY_ID);
    response.attachment("shaleian.xdn");
    stream.pipe(response);
  }

}