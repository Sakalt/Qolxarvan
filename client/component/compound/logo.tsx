//

import * as react from "react";
import {
  ReactNode
} from "react";
import Component from "/client/component/component";
import {
  style
} from "/client/component/decorator";


@style(require("./logo.scss"))
export default class Logo extends Component<Props, State> {

  public render(): ReactNode {
    let node = (
      <div styleName="root" tabIndex={0} onClick={() => this.pushPath("/")}>
        <img styleName="logo" src="http://ziphil.com/material/logo/2.svg"/>
        <span styleName="orange">sOxsOt</span> <span styleName="blue">IvO lIvAt</span>
      </div>
    );
    return node;
  }

}


type Props = {
};
type State = {
};