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
        Hello!
      </Page>
    );
    return node;
  }

}


type Props = {
};
type State = {
};