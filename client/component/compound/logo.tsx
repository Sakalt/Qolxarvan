//

import * as react from "react";
import {
  ReactNode
} from "react";
import Component from "/client/component/component";
import {
  style
} from "/client/component/decorator";
import {
  LANGUAGES
} from "/client/language";


@style(require("./logo.scss"))
export default class Logo extends Component<Props, State> {

  public render(): ReactNode {
    const languageNodes = LANGUAGES.map((language) => {
      const languageStyleName = "locale" + ((language.locale === this.props.store!.locale) ? " selected" : "");
      const languageNode = (
        <div key={language.locale} styleName={languageStyleName} tabIndex={0} onClick={() => this.props.store!.changeLocale(language.locale)}>{language.name}</div>
      );
      return languageNode;
    });
    const node = (
      <div styleName="root">
        <img styleName="logo" src="http://ziphil.com/material/logo/2.svg"/>
        <div styleName="text-container">
          <div styleName="text" tabIndex={0} onClick={() => this.pushPath("/")}>
            <span styleName="orange">sOxsOt</span> <span styleName="blue">IvO lIvAt</span>
          </div>
          <div styleName="language">
            {languageNodes}
          </div>
        </div>
      </div>
    );
    return node;
  }

}


type Props = {
};
type State = {
};