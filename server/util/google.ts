//

import {
  GoogleSpreadsheet
} from "google-spreadsheet";
import {
  google
} from "googleapis";
import {
  Readable
} from "stream";
import {
  GOOGLE_CREDENTIALS
} from "/server/variable";


export class GoogleUtils {

  public static async downloadFile(fileId: string): Promise<Readable> {
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
    let response = await drive.files.get({fileId, alt: "media"}, {responseType: "stream"});
    let stream = response.data;
    return stream;
  }

  public static async fetchSpreadsheet(fileId: string): Promise<GoogleSpreadsheet> {
    let spreadsheet = new GoogleSpreadsheet(fileId);
    await spreadsheet.useServiceAccountAuth(GOOGLE_CREDENTIALS);
    await spreadsheet.loadInfo();
    return spreadsheet;
  }

}