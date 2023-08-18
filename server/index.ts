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
import multer from "multer";
import {
  DictionaryController
} from "/server/controller";
import {
  DiscordController
} from "/server/discord";
import {
  DiscordClient
} from "/server/util/client";
import {
  COOKIE_SECRET,
  ENABLE_DISCORD,
  PORT
} from "/server/variable";


export class Main {

  private application!: Express;

  public main(): void {
    this.application = express();
    this.setupBodyParsers();
    this.setupCookie();
    this.setupMulter();
    this.setupDirectories();
    this.setupControllers();
    this.setupStatic();
    this.setupFallbackHandlers();
    this.setupErrorHandler();
    this.listen();
  }

  private setupBodyParsers(): void {
    const urlencodedParser = express.urlencoded({extended: false});
    const jsonParser = express.json();
    this.application.use(urlencodedParser);
    this.application.use(jsonParser);
  }

  private setupCookie(): void {
    const middleware = cookieParser(COOKIE_SECRET);
    this.application.use(middleware);
  }

  private setupMulter(): void {
    const middleware = multer({dest: "./dist/upload/"}).single("file");
    this.application.use("/api*", middleware);
  }

  private setupDirectories(): void {
    fs.mkdirSync("./dist/temp", {recursive: true});
    fs.mkdirSync("./dist/upload", {recursive: true});
  }

  private setupControllers(): void {
    DictionaryController.use(this.application);
    if (ENABLE_DISCORD) {
      DiscordController.setup(DiscordClient.instance);
    }
  }

  private setupStatic(): void {
    this.application.use("/client", express.static(process.cwd() + "/dist/client"));
    this.application.use("/static", express.static(process.cwd() + "/dist/static"));
  }

  private setupFallbackHandlers(): void {
    const internalHandler = function (request: Request, response: Response, next: NextFunction): void {
      const fullUrl = request.protocol + "://" + request.get("host") + request.originalUrl;
      response.status(404).end();
    };
    const otherHandler = function (request: Request, response: Response, next: NextFunction): void {
      const method = request.method;
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
    const handler = function (error: any, request: Request, response: Response, next: NextFunction): void {
      console.error(error);
      response.status(500).end();
    };
    this.application.use(handler);
  }

  private listen(): void {
    this.application.listen(+PORT, () => {
      console.log(`Listening (port: ${PORT})`);
    });
  }

}


const main = new Main();
main.main();