/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const CompLibrary = require('../../core/CompLibrary');

const Container = CompLibrary.Container;

const cwd = process.cwd();

const siteConfig = require(`${cwd}/siteConfig.js`);
const versions = require(`${cwd}/versions.json`);

function Versions(props) {
  const language = props.language ? `${props.language}/` : '';
  const latestVersion = versions[0];
  const { repoUrl } = siteConfig;
  return (
    <div className="docMainWrapper wrapper">
      <Container className="mainContainer versionsContainer">
        <div className="post">
          <header className="postHeader">
            <h1>{siteConfig.title} Versions</h1>
          </header>
          <p>New versions of Muster are released periodically.</p>
          <h3 id="latest">Current version</h3>
          <table className="versions">
            <tbody>
              <tr>
                <th>{latestVersion}</th>
                <td>
                  <a href={`${siteConfig.baseUrl}docs/${language}overview.html`}>Documentation</a>
                </td>
                <td>
                  <a href={`${siteConfig.baseUrl}docs/${language}changelog.html`}>Release Notes</a>
                </td>
              </tr>
            </tbody>
          </table>
          <h3 id="rc">Pre-release versions</h3>
          <table className="versions">
            <tbody>
              <tr>
                <th>next</th>
                <td>
                  <a href={`${siteConfig.baseUrl}docs/${language}next/overview.html`}>
                    Documentation
                  </a>
                </td>
                <td>
                  <a href={`${siteConfig.baseUrl}docs/${language}next/changelog.html`}>
                    Release Notes
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
          <h3 id="archive">Past Versions</h3>
          <p>Here you can find documentation for previous versions.</p>
          <table className="versions">
            <tbody>
              {versions.map(
                (version) =>
                  version !== latestVersion && (
                    <tr key={version}>
                      <th>{version}</th>
                      <td>
                        <a href={`${siteConfig.baseUrl}docs/${language}/${version}/overview.html`}>
                          Documentation
                        </a>
                      </td>
                    </tr>
                  ),
              )}
            </tbody>
          </table>
          <p>
            You can find past versions of Muster on <a href={repoUrl}>GitHub</a>.
          </p>
        </div>
      </Container>
    </div>
  );
}

module.exports = Versions;
