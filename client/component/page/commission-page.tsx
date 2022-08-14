//

import * as react from "react";
import {
  ReactNode
} from "react";
import Component from "/client/component/component";
import CommissionForm from "/client/component/compound/commission-form";
import Logo from "/client/component/compound/logo";
import {
  style
} from "/client/component/decorator";
import Page from "/client/component/page/page";


@style(require("./commission-page.scss"))
export default class CommissionPage extends Component<Props, State> {

  public state: State = {
  };

  public async componentDidMount(): Promise<void> {
  }

  public render(): ReactNode {
    const node = (
      <Page>
        <div styleName="header">
          <Logo/>
        </div>
        <div styleName="commission-pane">
          <CommissionForm/>
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