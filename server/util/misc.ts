//

import {
  nanoid
} from "nanoid";


export function getTempFilePath(extension?: string): string {
  if (extension !== undefined) {
    return `./dist/temp/temp-${nanoid()}.${extension}`;
  } else {
    return `./dist/temp/temp-${nanoid()}`;
  }
}