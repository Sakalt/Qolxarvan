//

import {
  History,
  createBrowserHistory
} from "history";
import {
  Provider
} from "mobx-react";
import * as react from "react";
import {
  ReactNode
} from "react";
import {
  IntlProvider
} from "react-intl";
import {
  Route,
  Router,
  Switch
} from "react-router-dom";
import Component from "/client/component/component";
import {
  style
} from "/client/component/decorator";
import TopPage from "/client/component/page/top-page";
import {
  GlobalStore
} from "/client/component/store";
import ScrollTop from "/client/component/util/scroll-top";


@style(require("./root.scss"), {withRouter: false, inject: false, injectIntl: false, observer: true})
export class Root extends Component<Props, State> {

  private store: GlobalStore = new GlobalStore();
  private history: History = createBrowserHistory();

  public state: State = {
    ready: false
  };

  public async componentDidMount(): Promise<void> {
    await this.store.defaultLocale();
    this.setState({ready: true});
  }

  public render(): ReactNode {
    let node = (this.state.ready) && (
      <Router history={this.history}>
        <Provider store={this.store}>
          <IntlProvider defaultLocale="ja" locale={this.store.locale} messages={this.store.messages}>
            <ScrollTop>
              <Switch>
                <Route exact sensitive path="/" component={TopPage}/>
              </Switch>
            </ScrollTop>
          </IntlProvider>
        </Provider>
      </Router>
    );
    return node;
  }

}


type Props = {
};
type State = {
  ready: boolean
};