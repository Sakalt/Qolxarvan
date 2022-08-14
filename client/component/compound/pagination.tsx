//

import * as react from "react";
import {
  ReactNode
} from "react";
import Component from "/client/component/component";
import {
  style
} from "/client/component/decorator";


@style(require("./pagination.scss"))
export default class Pagination extends Component<Props, State> {

  private handleSet(page: number | "first" | "last"): void {
    const minPage = this.props.minPage;
    const maxPage = this.props.maxPage;
    const nextPage = (() => {
      if (page === "first") {
        return 0;
      } else if (page === "last") {
        return maxPage;
      } else {
        return page;
      }
    })();
    const clampedPage = Math.max(Math.min(nextPage, maxPage), minPage);
    if (this.props.onSet) {
      this.props.onSet(clampedPage);
    }
  }

  private renderButtons(direction: -1 | 1): ReactNode {
    const nodes = [];
    const currentPage = this.props.page;
    const targetPage = (direction === -1) ? this.props.minPage : this.props.maxPage;
    let difference = 2;
    for (let i = 0 ; i < 5 ; i ++) {
      const nextPage = currentPage + (difference - 1) * direction;
      if ((direction === -1 && nextPage >= targetPage) || (direction === 1 && nextPage <= targetPage)) {
        const node = <div styleName="button" tabIndex={0} key={nextPage} onClick={() => this.handleSet(nextPage)}>{this.transNumber(nextPage + 1)}</div>;
        nodes.push(node);
      }
      difference *= 2;
    }
    if (direction === -1) {
      nodes.reverse();
    }
    return nodes;
  }

  public render(): ReactNode {
    const page = this.props.page;
    const leftButtonNode = this.renderButtons(-1);
    const rightButtonNode = this.renderButtons(1);
    const node = (
      <div styleName="root">
        <div styleName="leftmost">
          <div styleName="group">
            <div styleName="button icon" tabIndex={0} onClick={() => this.handleSet("first")}>&#xF100;</div>
            <div styleName="button icon" tabIndex={0} onClick={() => this.handleSet(page - 1)}>&#xF104;</div>
          </div>
        </div>
        <div styleName="left">
          <div styleName="group">
            {leftButtonNode}
          </div>
        </div>
        <div styleName="center">
          <div styleName="button" tabIndex={0}>{this.transNumber(page + 1)}</div>
        </div>
        <div styleName="right">
          <div styleName="group">
            {rightButtonNode}
          </div>
        </div>
        <div styleName="rightmost">
          <div styleName="group">
            <div styleName="button icon" tabIndex={0} onClick={() => this.handleSet(page + 1)}>&#xF105;</div>
            <div styleName="button icon" tabIndex={0} onClick={() => this.handleSet("last")}>&#xF101;</div>
          </div>
        </div>
      </div>
    );
    return node;
  }

}


type Props = {
  page: number,
  minPage: number,
  maxPage: number,
  onSet?: (page: number) => void
};
type State = {
};