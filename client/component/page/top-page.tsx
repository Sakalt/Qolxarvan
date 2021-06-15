//

import * as react from "react";
import {
  ReactNode
} from "react";
import Component from "/client/component/component";
import {
  style
} from "/client/component/decorator";


@style(require("./top-page.scss"))
export default class TopPage extends Component<Props, State> {

  public render(): ReactNode {
    let node = (
      <div>
        Hello!
      </div>
    );
    return node;
  }

}


type Props = {
};
type State = {
};