//

import cors from "cors";
import {
  Request,
  Response
} from "express";
import * as fp from "fp-ts";
import fs from "fs";
import * as io from "io-ts";
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
  before,
  controller,
  cron,
  get,
  post
} from "/server/controller/decorator";
import {
  ExtendedDictionary
} from "/server/util/dictionary";


@controller("/api/dictionary")
export class DictionaryController extends Controller {

  @get("/fetch")
  public async [Symbol()](request: Request, response: Response): Promise<void> {
    let dictionary = await ExtendedDictionary.fetch();
    let plainDictionary = dictionary.toPlain();
    response.json(plainDictionary).end();
  }

  @get("/download")
  public async [Symbol()](request: Request, response: Response): Promise<void> {
    if (request.query.kind === "single" || request.query.kind === "oldShaleian") {
      let kind = request.query.kind as SaverKind;
      let path = `./dist/temp/temp-${nanoid()}.xdn`;
      let fileName = "shaleian" + ((kind === "single") ? ".xdn" : ".xdc");
      let dictionary = await ExtendedDictionary.fetch();
      let saver = SaverCreator.createByKind(kind, dictionary, path);
      await saver.asPromise();
      response.download(path, fileName, (error) => {
        fs.promises.unlink(path);
      });
    } else {
      response.sendStatus(400).end();
    }
  }

  @get("/count")
  @before(cors())
  public async [Symbol()](request: Request, response: Response): Promise<void> {
    let dictionary = await ExtendedDictionary.fetch();
    let count = dictionary.words.length;
    response.json(count).end();
  }

  @get("/difference")
  @before(cors())
  public async [Symbol()](request: Request, response: Response): Promise<void> {
    let codec = io.type({
      duration: io.union([io.string, io.array(io.string)])
    });
    let query = codec.decode(request.query);
    if (fp.either.isRight(query)) {
      let duration = (typeof query.right.duration === "string") ? [+query.right.duration] : query.right.duration.map((element) => +element);
      let dictionary = await ExtendedDictionary.fetch();
      let difference = await dictionary.fetchWordCountDifferences(duration);
      response.json(difference).end();
    } else {
      response.sendStatus(400).end();
    }
  }

  @cron("0 5 * * *")
  public async [Symbol()](): Promise<void> {
    let dictionary = await ExtendedDictionary.fetch();
    await dictionary.saveHistory();
    console.log("history saved");
  }

}