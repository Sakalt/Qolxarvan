//

import cors from "cors";
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
  before,
  controller,
  cron,
  get,
  post
} from "/server/controller/decorator";
import {
  ExtendedDictionary
} from "/server/util/dictionary";
import {
  PASSWORD
} from "/server/variable";


@controller("/api/dictionary")
export class DictionaryController extends Controller {

  @get("/fetch")
  public async [Symbol()](request: Request, response: Response): Promise<void> {
    let dictionary = await ExtendedDictionary.fetch();
    let plainDictionary = dictionary.toPlain();
    response.json(plainDictionary).end();
  }

  @post("/upload")
  public async [Symbol()](request: Request, response: Response): Promise<void> {
    let password = request.body.password;
    let path = request.file?.path;
    if (password === PASSWORD && path !== undefined) {
      await ExtendedDictionary.upload(path);
      await fs.promises.unlink(path);
      response.json(null).end();
    } else {
      response.sendStatus(400).end();
    }
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
    let durations = (() => {
      let rawDurations = request.query.durations as any;
      if (typeof rawDurations === "string") {
        return [+rawDurations];
      } else if (Array.isArray(rawDurations) && rawDurations.every((element) => typeof element === "string")) {
        return rawDurations.map((element) => +element);
      } else {
        return undefined;
      }
    })();
    if (durations !== undefined) {
      let dictionary = await ExtendedDictionary.fetch();
      let difference = await dictionary.fetchWordCountDifferences(durations);
      response.json(difference).end();
    } else {
      response.sendStatus(400).end();
    }
  }

  @cron("*/30 * * * *")
  public async [Symbol()](): Promise<void> {
    let dictionary = await ExtendedDictionary.fetch();
    await dictionary.saveHistory();
    console.log("history saved");
  }

}