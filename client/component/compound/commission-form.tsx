//

import * as react from "react";
import {
  ReactNode
} from "react";
import Input from "/client/component/atom/input";
import Component from "/client/component/component";
import {
  style
} from "/client/component/decorator";


@style(require("./commission-form.scss"))
export default class CommissionForm extends Component<Props, State> {

  public state: State = {
    nameString: ""
  };

  public render(): ReactNode {
    const node = (
      <form styleName="root" onSubmit={(event) => event.preventDefault()}>
        <div styleName="textarea-wrapper">
          <Input value={this.state.nameString} onSet={(nameString) => this.setState({nameString})}/>
        </div>
      </form>
    );
    return node;
  }

}


type Props = {
};
type State = {
  nameString: string
};