//

import * as react from "react";
import {
  MouseEvent,
  ReactNode
} from "react";
import {
  Dictionary,
  SearchResult
} from "soxsot";
import Component from "/client/component/component";
import WordPane from "/client/component/compound/word-pane";
import {
  style
} from "/client/component/decorator";


@style(require("./word-list.scss"))
export default class WordList extends Component<Props, State> {

  public render(): ReactNode {
    const displayedWords = this.props.searchResult.sliceWords(this.props.page);
    const wordPanes = displayedWords.map((word) => {
      const wordPane = (
        <WordPane
          dictionary={this.props.dictionary}
          word={word}
          key={word.uid}
          onLinkClick={this.props.onLinkClick}
        />
      );
      return wordPane;
    });
    const node = (
      <div styleName="root">
        {wordPanes}
      </div>
    );
    return node;
  }

}


type Props = {
  dictionary: Dictionary,
  searchResult: SearchResult,
  page: number,
  onLinkClick?: (name: string, event: MouseEvent<HTMLSpanElement>) => void
};
type State = {
};