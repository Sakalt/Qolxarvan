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
    let languageNodes = LANGUAGES.map((language) => {
      let languageStyleName = "locale" + ((language.locale === this.props.store!.locale) ? " selected" : "");
      let languageNode = (
        <div key={language.locale} styleName={languageStyleName} tabIndex={0} onClick={() => this.props.store!.changeLocale(language.locale)}>{language.name}</div>
      );
      return languageNode;
    });
    let node = (
      <div styleName="root" tabIndex={0} onClick={() => this.pushPath("/")}>
        <img styleName="logo" src="http://ziphil.com/material/logo/2.svg"/>
        <div styleName="text-container">
          <div styleName="text">
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