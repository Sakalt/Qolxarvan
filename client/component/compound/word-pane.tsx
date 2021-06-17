//

import partial from "lodash-es/partial";
import * as react from "react";
import {
  Fragment,
  MouseEvent,
  ReactNode
} from "react";
import {
  Dictionary,
  Equivalent,
  ExampleInformation,
  InformationKindUtil,
  Marker,
  MarkupResolver,
  NormalInformation,
  ParsedWord,
  Parser,
  PhraseInformation,
  Relation,
  Section,
  Word
} from "soxsot";
import Component from "/client/component/component";
import {
  style
} from "/client/component/decorator";


@style(require("./word-pane.scss"))
export default class WordPane extends Component<Props, State> {

  private renderHead(word: ParsedWord<ReactNode>): ReactNode {
    let sort = word.parts[this.props.store!.locale]?.sort ?? null;
    let categoryNode = (sort !== null) && (
      <span className="swp-head-sort swp-tag swp-right-margin">{sort}</span>
    );
    let nameNode = (
      <span className="swp-head-name swp-right-margin">
        <span className="swp-sans">{word.name}</span>
      </span>
    );
    let pronunciationNode = (word.pronunciation !== null) && (
      <span className="swp-head-pronunciation swp-right-margin">
        /{word.pronunciation}/
      </span>
    );
    let dateNode = (
      <span className="swp-head-date">{word.date}</span>
    );
    let node = (
      <div className="swp-head">
        <div className="swp-head-left">
          {categoryNode}
          {nameNode}
          {pronunciationNode}
          {dateNode}
        </div>
      </div>
    );
    return node;
  }

  private renderSection(section: Section<ReactNode>, index: number): ReactNode {
    let equivalents = section.getEquivalents(true);
    let normalInformations = section.getNormalInformations(true);
    let phraseInformations = section.getPhraseInformations(true);
    let exampleInformations = section.getExampleInformations(true);
    let relations = section.relations;
    let equivalentNodes = equivalents.map((equivalent, index) => this.renderEquivalent(equivalent, index));
    let normalInformationNodes = normalInformations.map((information, index) => this.renderNormalInformation(information, index));
    let phraseInformationNode = this.renderPhraseInformations(phraseInformations);
    let exampleInformationNode = this.renderExampleInformations(exampleInformations);
    let relationNodes = relations.map((relation, index) => this.renderRelation(relation, index));
    let equivalentNode = (equivalents.length > 0) && (
      <ul className="swp-equivalents swp-section-item swp-list">
        {equivalentNodes}
      </ul>
    );
    let relationNode = (section.relations.length > 0) && (
      <ul className="swp-relations swp-section-item swp-list">
        {relationNodes}
      </ul>
    );
    let node = (
      <div className="swp-section" key={`section-${index}`}>
        {equivalentNode}
        {normalInformationNodes}
        {phraseInformationNode}
        {exampleInformationNode}
        {relationNode}
      </div>
    );
    return node;
  }

  private renderEquivalent(equivalent: Equivalent<ReactNode>, index: number): ReactNode {
    let categoryNode = (equivalent.category !== null) && (
      <span className="swp-equivalent-category swp-tag swp-right-margin">{equivalent.category}</span>
    );
    let frameNode = (equivalent.frame !== null) && (
      <span className="swp-equivalent-frame swp-small swp-right-margin">({equivalent.frame})</span>
    );
    let nameNodes = equivalent.names.map((name, index) => {
      let nameNode = (
        <Fragment key={`equivalent-inner-${index}`}>
          {name}
        </Fragment>
      );
      return nameNode;
    });
    let node = (
      <li className="swp-equivalent swp-text swp-list-item" key={`equivalent-${index}`}>
        {categoryNode}
        {frameNode}
        {WordPane.intersperse(nameNodes, ", ")}
      </li>
    );
    return node;
  }

  private renderNormalInformation(information: NormalInformation<ReactNode>, index: number): ReactNode {
    let node = (
      <div className="swp-information swp-section-item" key={`information-${index}`}>
        <div className="swp-information-kind swp-small-head">
          <span className="swp-information-kind-inner swp-small-head-inner">{InformationKindUtil.getName(information.kind, this.props.store!.locale)}</span>
        </div>
        <div className="swp-information-text swp-text">
          {information.text}
        </div>
      </div>
    );
    return node;
  }

  private renderPhraseInformations(informations: ReadonlyArray<PhraseInformation<ReactNode>>): ReactNode {
    let innerNodes = informations.map((information, index) => {
      let expressionNode = (
        <dt className="swp-phrase-expression">
          {information.expression}
          <span className="swp-phrease-divider">—</span>
          {information.equivalentNames.join(", ")}
        </dt>
      );
      let textNode = (information.text !== null) && (
        <dd className="swp-phrase-inner-text">
          {information.text}
        </dd>
      );
      let innerNode = (
        <Fragment key={`phrase-inner-${index}`}>
          {expressionNode}
          {textNode}
        </Fragment>
      );
      return innerNode;
    });
    let node = (informations.length > 0) && (
      <div className="swp-information swp-section-item" key="information-phrase">
        <div className="swp-information-kind swp-small-head">
          <span className="swp-information-kind-inner swp-small-head-inner">{InformationKindUtil.getName("phrase", this.props.store!.locale)}</span>
        </div>
        <dl className="swp-phrase-text swp-information-text swp-text">
          {innerNodes}
        </dl>
      </div>
    );
    return node;
  }

  private renderExampleInformations(informations: ReadonlyArray<ExampleInformation<ReactNode>>): ReactNode {
    let innerNodes = informations.map((information, index) => {
      let sentenceNode = (
        <dt className="swp-example-sentence">
          {information.sentence}
        </dt>
      );
      let translationNode = (
        <dd className="swp-example-translation">
          {information.translation}
        </dd>
      );
      let innerNode = (
        <Fragment key={`example-inner-${index}`}>
          {sentenceNode}
          {translationNode}
        </Fragment>
      );
      return innerNode;
    });
    let node = (informations.length > 0) && (
      <div className="swp-information swp-section-item" key="information-example">
        <div className="swp-information-kind swp-small-head">
          <span className="swp-information-kind-inner swp-small-head-inner">{InformationKindUtil.getName("example", this.props.store!.locale)}</span>
        </div>
        <dl className="swp-example-text swp-information-text swp-text">
          {innerNodes}
        </dl>
      </div>
    );
    return node;
  }

  private renderRelation(relation: Relation<ReactNode>, index: number): ReactNode {
    let titleNode = (relation.title !== null) && (
      <span className="swp-relation-title swp-tag swp-right-margin">{relation.title}</span>
    );
    let entryNodes = relation.entries.map((entry, index) => {
      let referNode = entry.refer && <span className="swp-refer">*</span>;
      let entryNode = (
        <Fragment key={`relation-inner-${index}`}>
          {entry.name}
          {referNode}
        </Fragment>
      );
      return entryNode;
    });
    let node = (
      <li className="swp-relation swp-text swp-list-item" key={`relation-${index}`}>
        {titleNode}
        {WordPane.intersperse(entryNodes, ", ")}
      </li>
    );
    return node;
  }

  private renderWord(word: ParsedWord<ReactNode>, markers: Array<Marker>): ReactNode {
    let headNode = this.renderHead(word);
    let className = "swp-word" + ((markers.length > 0) ? ` swp-word-${markers[markers.length - 1]}` : "");
    let sectionNodes = word.parts[this.props.store!.locale]?.sections.map((section, index) => this.renderSection(section, index));
    let sectionNode = (sectionNodes !== undefined && sectionNodes.length > 0) && (
      <div className="swp-sections">
        {sectionNodes}
      </div>
    );
    let node = (
      <div className={className}>
        {headNode}
        {sectionNode}
      </div>
    );
    return node;
  }

  public render(): ReactNode {
    let resolver = WordPane.createMarkupResolver(this.props.onLinkClick);
    let parser = new Parser(resolver);
    let word = parser.parse(this.props.word);
    let markers = this.props.word.markers;
    let node = this.renderWord(word, markers);
    return node;
  }

  public static createMarkupResolver(onLinkClick?: (name: string, event: MouseEvent<HTMLSpanElement>) => void): MarkupResolver<ReactNode, ReactNode> {
    let resolveLink = function (name: string, children: Array<ReactNode | string>): ReactNode {
      let node = <span className="swp-link" key={Math.random()} onClick={onLinkClick && partial(onLinkClick, name)}>{children}</span>;
      return node;
    };
    let resolveBracket = function (children: Array<ReactNode | string>): ReactNode {
      let node = <span className="swp-sans" key={Math.random()}>{children}</span>;
      return node;
    };
    let resolveSlash = function (string: string): ReactNode {
      let node = <span className="swp-italic" key={Math.random()}>{string}</span>;
      return node;
    };
    let join = function (nodes: Array<ReactNode | string>): ReactNode {
      return nodes;
    };
    let resolver = new MarkupResolver({resolveLink, resolveBracket, resolveSlash, join});
    return resolver;
  }

  public static intersperse(nodes: ReadonlyArray<ReactNode>, separator: ReactNode): Array<ReactNode> {
    let resultNodes = [];
    for (let i = 0 ; i < nodes.length ; i ++) {
      if (i !== 0) {
        resultNodes.push(separator);
      }
      resultNodes.push(nodes[i]);
    }
    return resultNodes;
  }

}


type Props = {
  dictionary: Dictionary,
  word: Word,
  onLinkClick?: (name: string, event: MouseEvent<HTMLSpanElement>) => void
};
type State = {
};