/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

class Footer extends React.Component {
  docUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    return `${baseUrl}docs/${language ? `${language}/` : ''}${doc}`;
  }

  pageUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    return baseUrl + (language ? `${language}/` : '') + doc;
  }

  relativeUrl(doc) {
    const baseUrl = this.props.config.baseUrl;
    return baseUrl + doc;
  }

  render() {
    return (
      <footer className="nav-footer" id="footer">
        <section className="sitemap">
          <a href={this.props.config.baseUrl} className="nav-home">
            {this.props.config.footerIcon && (
              <img
                src={this.props.config.baseUrl + this.props.config.footerIcon}
                alt={this.props.config.title}
                width="66"
                height="58"
              />
            )}
          </a>
          <div>
            <h5>Docs</h5>
            <a href={this.docUrl('overview.html')}>Overview</a>
            <a href={this.docUrl('learn/introduction.html')}>Guides</a>
            <a href={this.relativeUrl('api/')}>API Reference</a>
            <a href={this.relativeUrl('playground/')}>Playground</a>
            <a href={this.docUrl('resources/faq.html')}>FAQ</a>
          </div>
          <div>
            <h5>Community</h5>
            <a href={this.pageUrl('users.html', this.props.language)}>User Showcase</a>
            <a
              href="http://stackoverflow.com/questions/tagged/muster"
              target="_blank"
              rel="noreferrer noopener"
            >
              Stack Overflow
            </a>
          </div>
          <div>
            <h5>More</h5>
            <a href={this.docUrl('changelog.html')}>Changelog</a>
            {/*<a href={`${this.props.config.baseUrl}blog`}>Blog</a>*/}
            <a href={this.props.config.repoUrl}>GitHub</a>
            <a
              className="github-button"
              href={this.props.config.repoUrl}
              data-icon="octicon-star"
              data-count-href="/facebook/docusaurus/stargazers"
              data-show-count="true"
              data-count-aria-label="# stargazers on GitHub"
              aria-label="Star this project on GitHub"
            >
              Star
            </a>
          </div>
        </section>

        <a
          href="https://www.github.com/dwstech/"
          target="_blank"
          rel="noreferrer noopener"
          className="fbOpenSource"
        >
          <img
            src={`${this.props.config.baseUrl}img/dws-logo-global.svg`}
            alt="DWS Technology Open Source"
            width="170"
            height="45"
          />
        </a>
        <section className="copyright">{this.props.config.copyright}</section>
      </footer>
    );
  }
}

module.exports = Footer;
