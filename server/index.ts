//

import cookieParser from "cookie-parser";
import express from "express";
import {
  Express,
  NextFunction,
  Request,
  Response
} from "express";
import fs from "fs";
import {
  DictionaryController,
  DiscordController,
  TwitterController
} from "/server/controller";
import {
  MainController as MainDiscordController
} from "/server/discord";
import {
  DiscordClient
} from "/server/util/client";
import {
  COOKIE_SECRET,
  PORT
} from "/server/variable";


export class Main {

  private application!: Express;

  public main(): void {
    this.application = express();
    this.setupBodyParsers();
    this.setupCookie();
    this.setupDirectories();
    this.setupRouterControllers();
    this.setupDiscordControllers();
    this.setupStatic();
    this.setupFallbackHandlers();
    this.setupErrorHandler();
    this.listen();
  }

  // リクエストボディをパースするミドルウェアの設定をします。
  private setupBodyParsers(): void {
    let urlencodedParser = express.urlencoded({extended: false});
    let jsonParser = express.json();
    this.application.use(urlencodedParser);
    this.application.use(jsonParser);
  }

  private setupCookie(): void {
    let middleware = cookieParser(COOKIE_SECRET);
    this.application.use(middleware);
  }

  private setupDirectories(): void {
    fs.mkdirSync("./dist/temp", {recursive: true});
  }

  private setupRouterControllers(): void {
    DictionaryController.use(this.application);
    DiscordController.use(this.application);
    TwitterController.use(this.application);
  }

  private setupDiscordControllers(): void {
    MainDiscordController.setup(DiscordClient.instance);
  }

  private setupStatic(): void {
    this.application.use("/client", express.static(process.cwd() + "/dist/client"));
    this.application.use("/static", express.static(process.cwd() + "/dist/static"));
  }

  private setupFallbackHandlers(): void {
    let internalHandler = function (request: Request, response: Response, next: NextFunction): void {
      let fullUrl = request.protocol + "://" + request.get("host") + request.originalUrl;
      response.status(404).end();
    };
    let otherHandler = function (request: Request, response: Response, next: NextFunction): void {
      let method = request.method;
      if ((method === "GET" || method === "HEAD") && request.accepts("html")) {
        response.sendFile(process.cwd() + "/dist/client/index.html", (error) => {
          if (error) {
            next(error);
          }
        });
      } else {
        next();
      }
    };
    this.application.use("/api*", internalHandler);
    this.application.use("*", otherHandler);
  }

  private setupErrorHandler(): void {
    let handler = function (error: any, request: Request, response: Response, next: NextFunction): void {
      console.error(error);
      response.status(500).end();
    };
    this.application.use(handler);
  }

  private listen(): void {
    this.application.listen(+PORT, () => {
      console.log(`listening, port: ${PORT}`);
    });
  }

}


let main = new Main();
main.main();