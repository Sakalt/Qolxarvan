//

import {
  Express,
  Router
} from "express";


export class Controller {

  protected router: Router;
  protected path: string;

  public constructor() {
    this.router = Router();
    this.path = "/";
  }

  protected setup(): void {
  }

  public static use<C extends Controller>(this: new() => C, application: Express): C {
    let controller = new this();
    controller.setup();
    application.use(controller.path, controller.router);
    return controller;
  }

}