//

import * as react from "react";
import {
  ReactNode
} from "react";
import Component from "/client/component/component";
import {
  style
} from "/client/component/decorator";
import Page from "/client/component/page/page";


@style(require("./dictionary-page.scss"))
export default class DictionaryPage extends Component<Props, State> {

  public render(): ReactNode {
    let node = (
      <Page>
        <div styleName="header">
          <img styleName="logo" src="http://ziphil.com/material/logo/2.svg"/>
          <span styleName="orange">sOxsOt</span> <span styleName="blue">IvO lIvAt</span>
        </div>
      </Page>
    );
    return node;
  }

}


type Props = {
};
type State = {
};