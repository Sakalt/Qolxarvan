//

import axios from "axios";
import * as queryParser from "query-string";
import * as react from "react";
import {
  ReactNode
} from "react";
import {
  Dictionary,
  NormalParameter,
  Parameter,
  SearchResult
} from "soxsot";
import Component from "/client/component/component";
import {
  style
} from "/client/component/decorator";
import Page from "/client/component/page/page";
import {
  debounce
} from "/client/util/decorator";
import {
  ParameterUtils
} from "/client/util/parameter";


@style(require("./dictionary-page.scss"))
export default class DictionaryPage extends Component<Props, State> {

  public state: State = {
    dictionary: null,
    parameter: NormalParameter.createEmpty("ja"),
    page: 0,
    showExplanation: true,
    searchResult: SearchResult.createEmpty()
  };

  public constructor(props: any) {
    super(props);
    this.deserializeQuery(true);
  }

  public async componentDidMount(): Promise<void> {
    await this.fetchDictionary();
  }

  public async componentDidUpdate(previousProps: any): Promise<void> {
    if (this.props.location!.key !== previousProps.location!.key) {
      this.deserializeQuery(false, () => {
        if (!this.state.showExplanation) {
          this.updateWordsImmediately(false);
        }
      });
    }
  }

  private async fetchDictionary(): Promise<void> {
    this.setState({dictionary: null});
    try {
      let response = await axios.get("/api/dictionary/fetch");
      let dictionary = Dictionary.fromPlain(response.data);
      this.setState({dictionary}, () => {
        this.updateWordsImmediately(false);
      });
    } catch (error) {
      this.setState({dictionary: null});
    }
  }

  private async updateWordsImmediately(serialize: boolean = true): Promise<void> {
    let dictionary = this.state.dictionary;
    if (dictionary !== null) {
      let parameter = this.state.parameter;
      let searchResult = dictionary.search(parameter);
      this.setState({searchResult, showExplanation: false});
      if (serialize) {
        this.serializeQuery();
      }
    }
  }

  @debounce(500)
  private async updateWords(): Promise<void> {
    await this.updateWordsImmediately();
  }

  private deserializeQuery(first: boolean, callback?: () => void): void {
    let queryString = this.props.location!.search;
    let query = queryParser.parse(queryString);
    let language = this.props.store!.locale;
    let parameter = ParameterUtils.deserialize(query, language);
    let page = (typeof query.page === "string") ? +query.page : 0;
    let showExplanation = Object.keys(query).length <= 0;
    if (first) {
      this.state = Object.assign(this.state, {parameter, page, showExplanation});
      if (callback) {
        callback();
      }
    } else {
      this.setState({parameter, page, showExplanation}, callback);
    }
  }

  private serializeQuery(): void {
    let queryString = queryParser.stringify(ParameterUtils.serialize(this.state.parameter)) + `&page=${this.state.page}`;
    this.props.history!.replace({search: queryString});
  }

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
  dictionary: Dictionary | null,
  parameter: Parameter,
  page: number,
  showExplanation: boolean,
  searchResult: SearchResult
};