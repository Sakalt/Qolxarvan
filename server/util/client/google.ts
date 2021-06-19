//

import {
  JWT as OriginalGoogleClient
} from "google-auth-library/build/src";
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
  GOOGLE_EMAIL,
  GOOGLE_KEY
} from "/server/variable";


export class GoogleClient extends OriginalGoogleClient {

  public static instance: GoogleClient = GoogleClient.create();

  public static create(): GoogleClient {
    let scopes = [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/drive.metadata.readonly",
      "https://www.googleapis.com/auth/drive.appdata",
      "https://www.googleapis.com/auth/drive.metadata",
      "https://www.googleapis.com/auth/drive.photos.readonly"
    ];
    let client = new OriginalGoogleClient(GOOGLE_EMAIL, undefined, GOOGLE_KEY, scopes, undefined) as any;
    Object.setPrototypeOf(client, GoogleClient.prototype);
    return client;
  }

  public async downloadFile(fileId: string): Promise<Readable> {
    let drive = google.drive({version: "v3", auth: this});
    let response = await drive.files.get({fileId, alt: "media"}, {responseType: "stream"});
    let stream = response.data;
    return stream;
  }

  public async fetchSpreadsheet(fileId: string): Promise<GoogleSpreadsheet> {
    let spreadsheet = new GoogleSpreadsheet(fileId);
    let credentials = Object.fromEntries([["client_email", this.email!], ["private_key", this.key!]]) as any;
    await spreadsheet.useServiceAccountAuth(credentials);
    await spreadsheet.loadInfo();
    return spreadsheet;
  }

}