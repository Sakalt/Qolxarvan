//

import fs from "fs";
import {
  google
} from "googleapis";
import {
  nanoid
} from "nanoid";
import {
  Dictionary
} from "soxsot";
import {
  SingleLoader
} from "soxsot/dist/io";
import {
  Readable
} from "stream";
import {
  DICTIONARY_ID,
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

  public static async fetchDictionary(): Promise<Dictionary> {
    let path = `./dist/temp/temp-${nanoid()}.xdn`;
    let stream = await GoogleUtils.downloadFile(DICTIONARY_ID);
    let fileStream = fs.createWriteStream(path, {encoding: "utf-8"});
    let promise = new Promise<Dictionary>((resolve, reject) => {
      stream.on("data", (chunk) => {
        fileStream.write(chunk);
      });
      stream.on("end", async () => {
        fileStream.end();
        let loader = new SingleLoader(path);
        let dictionary = await loader.asPromise();
        await fs.promises.unlink(path);
        resolve(dictionary);
      });
      stream.on("error", (error) => {
        console.error(error);
        reject(error);
      });
    });
    let dictionary = await promise;
    return dictionary;
  }

}