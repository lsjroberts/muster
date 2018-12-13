/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const siteConfig = require(`${process.cwd()}/siteConfig.js`);

function imgUrl(img) {
  return `${siteConfig.baseUrl}img/${img}`;
}

function docUrl(doc, language) {
  return `${siteConfig.baseUrl}docs/${language ? `${language}/` : ''}${doc}`;
}

function pageUrl(page, language) {
  return siteConfig.baseUrl + (language ? `${language}/` : '') + page;
}

function relativeUrl(doc) {
  const baseUrl = siteConfig.baseUrl;
  return baseUrl + doc;
}

class Button extends React.Component {
  render() {
    const { className } = this.props;
    return (
      <div className="pluginWrapper buttonWrapper">
        <a
          className={`button ${className || ''}`}
          href={this.props.href}
          target={this.props.target}
        >
          {this.props.children}
        </a>
      </div>
    );
  }
}

Button.defaultProps = {
  target: '_self',
};

const SplashContainer = (props) => (
  <div className="homeContainer">
    <div className="homeSplashFade">
      <div className="wrapper homeWrapper">{props.children}</div>
    </div>
  </div>
);

const Logo = (props) => (
  <div className="projectLogo">
    <img src={props.img_src} alt="Project Logo" />
  </div>
);

const ProjectTitle = () => (
  <h2 className="projectTitle">
    {siteConfig.title}
    <small>{siteConfig.tagline}</small>
  </h2>
);

const PromoSection = (props) => (
  <div className="section promoSection">
    <div className="promoRow">
      <div className="pluginRowBlock">{props.children}</div>
    </div>
  </div>
);

class HomeSplash extends React.Component {
  render() {
    const language = this.props.language || '';
    return (
      <SplashContainer>
        <Logo img_src={imgUrl('muster-home.svg')} />
        <div className="inner">
          <ProjectTitle />
          <PromoSection>
            <Button href={docUrl('overview.html', language)}>What is Muster?</Button>
            <Button className="primary" href={docUrl('learn/introduction.html', language)}>
              Get Started
            </Button>
            <Button href={relativeUrl('api/latest/')}>API Docs</Button>
          </PromoSection>
        </div>
        <div className="embed-container">
          <Embed />
        </div>
      </SplashContainer>
    );
  }
}

const Embed = () => {
  return (
    <iframe
      height={300}
      width="100%"
      src={relativeUrl(
        '/playground/embed/?toggles=eyJzaG93R3JhcGgiOnRydWUsInNob3dRdWVyeSI6dHJ1ZSwic2hvd1F1ZXJ5UmVzdWx0Ijp0cnVlLCJzaG93Q29udGFpbmVyIjpmYWxzZSwic2hvd1ZpZXciOmZhbHNlLCJzaG93Vmlld1Jlc3VsdCI6ZmFsc2V9&graph=IntcbiAgZ3JlZXRpbmc6ICdIZWxsbycsXG4gIHVzZXI6ICd3b3JsZCcsXG4gIHdlbGNvbWU6IGZvcm1hdCgnJHtzYWx1dGF0aW9ufSwgJHtuYW1lfSEnLCB7XG4gICAgc2FsdXRhdGlvbjogcmVmKCdncmVldGluZycpLFxuICAgIG5hbWU6IHJlZigndXNlcicpLFxuICB9KSxcbn0i',
      )}
    />
  );
};

class Index extends React.Component {
  render() {
    const language = this.props.language || '';

    return (
      <div>
        <HomeSplash language={language} />
      </div>
    );
  }
}

module.exports = Index;
