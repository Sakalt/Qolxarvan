//

import {
  Request,
  Response
} from "express";
import {
  google
} from "googleapis";
import {
  Controller
} from "/server/controller/controller";
import {
  controller,
  get,
  post
} from "/server/controller/decorator";
import {
  DICTIONARY_ID,
  GOOGLE_CREDENTIALS
} from "/server/variable";


@controller("/api/dictionary")
export class DictionaryController extends Controller {

  @get("/fetch")
  public async [Symbol()](request: Request, response: Response): Promise<void> {
    let scopes = [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/drive.metadata.readonly",
      "https://www.googleapis.com/auth/drive.appdata",
      "https://www.googleapis.com/auth/drive.metadata",
      "https://www.googleapis.com/auth/drive.photos.readonly"
    ];
    let auth = new google.auth.JWT(GOOGLE_CREDENTIALS["client_email"], undefined, GOOGLE_CREDENTIALS["private_key"], scopes, undefined);
    let drive = google.drive({version: "v3", auth});
    let fileId = DICTIONARY_ID;
    let fileResponse = await drive.files.get({fileId, alt: "media"}, {responseType: "stream"});
    let stream = fileResponse.data;
    stream.pipe(response);
  }

}