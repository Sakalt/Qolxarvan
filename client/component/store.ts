//

import {
  action,
  observable
} from "mobx";
import {
  LANGUAGES
} from "/client/language";


export class GlobalStore {

  @observable
  public locale: string = "";

  @observable
  public messages: Record<string, string> = {};

  @action
  public async changeLocale(locale: string): Promise<void> {
    let language = LANGUAGES.find((language) => language.locale === locale) ?? LANGUAGES[0];
    this.locale = locale;
    this.messages = await language.fetchMessages().then((module) => module.default);
    localStorage.setItem("locale", locale);
  }

  @action
  public async defaultLocale(): Promise<void> {
    let locale = localStorage.getItem("locale") ?? "ja";
    this.changeLocale(locale);
  }

}