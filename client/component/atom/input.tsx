//

import * as react from "react";
import {
  ChangeEvent,
  ReactNode
} from "react";
import Component from "/client/component/component";
import {
  style
} from "/client/component/decorator";


@style(require("./input.scss"))
export default class Input extends Component<Props, State> {

  public static defaultProps: DefaultProps = {
    value: "",
    disabled: false
  };

  private handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const value = event.target.value;
    if (this.props.onSet) {
      this.props.onSet(value);
    }
    if (this.props.onChange) {
      this.props.onChange(event);
    }
  }

  public render(): ReactNode {
    const node = (
      <div styleName="root" className={this.props.className}>
        <input
          styleName="input-inner"
          value={this.props.value}
          disabled={this.props.disabled}
          onChange={this.handleChange.bind(this)}
        />
      </div>
    );
    return node;
  }

}


type Props = {
  value: string,
  disabled: boolean,
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void,
  onSet?: (value: string) => void,
  className?: string
};
type DefaultProps = {
  value: string,
  disabled: boolean
};
type State = {
};