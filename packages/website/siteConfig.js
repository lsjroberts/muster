/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// See https://docusaurus.io/docs/site-config for all the possible
// site configuration options.

// List of projects/orgs using Muster for the users page.
const users = require('./userList');

const url = 'https://dwstech.github.io';
const baseUrl = '/muster/';
const repoUrl = 'https://github.com/dwstech/muster';

const siteConfig = {
  title: 'Muster', // Title for your website.
  tagline: 'A universal data layer for components and services',
  url, // Your website URL
  baseUrl, // Base URL for your project */
  editUrl: `${repoUrl}/edit/develop/packages/website/docs/`,

  customDocsPath: 'website/docs',

  // Used for publishing and more
  projectName: 'muster',
  organizationName: 'dwstech',

  // For no header links in the top nav bar -> headerLinks: [],
  headerLinks: [
    { doc: 'overview', label: 'Docs' },
    { href: `${baseUrl || '/'}api/`, label: 'API reference' },
    { href: `${baseUrl || '/'}playground/`, label: 'Playground' },
    { doc: 'resources/faq', label: 'FAQ' },
    { page: 'help', label: 'Help' },
    // { blog: false, label: 'Blog' },
    { href: repoUrl, label: 'GitHub' },
  ],

  // If you have users set above, you add it here:
  users,

  /* path to images for header/footer */
  // headerIcon: 'img/muster.svg',
  footerIcon: 'img/muster.svg',
  favicon: 'img/favicon.png',

  /* Colors for website */
  colors: {
    primaryColor: '#6d294a',
    secondaryColor: '#9c3a69',
  },

  /* Custom fonts for website */
  fonts: {
    content: [
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'Fira Sans',
      'Droid Sans',
      'Helvetica Neue',
      'sans-serif',
    ],
    header: ['Roboto Slab', 'serif'],
  },

  // This copyright info is used in /core/Footer.js and blog RSS/Atom feeds.
  copyright: `Copyright © ${new Date().getFullYear()} DWS Technology`,

  highlight: {
    // Highlight.js theme to use for syntax highlighting in code blocks.
    theme: 'vs2015',
  },
  // usePrism: true,

  // Add custom scripts here that would be placed in <script> tags.
  scripts: [
    'https://cdn.polyfill.io/v2/polyfill.min.js',
    'https://buttons.github.io/buttons.js',
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.min.js',
      async: true,
    },
    {
      src: 'https://unpkg.com/tippy.js@3/dist/tippy.all.min.js',
      async: true,
    },
    {
      src: `${baseUrl}js/code-blocks-buttons.js`,
      async: true,
    },
    {
      src: `${baseUrl}js/glossary.min.js`,
      async: true,
    },
  ],
  separateCss: ['static/api/assets/css'],
  stylesheets: [
    'https://fonts.googleapis.com/css?family=Roboto+Slab',
    'https://unpkg.com/tippy.js@3/dist/themes/light.css',
  ],
  // On page navigation for the current documentation page.
  onPageNav: 'separate',
  enableUpdateTime: true,
  // No .html extensions for paths.
  cleanUrl: true,
  scrollToTop: true,
  // Open Graph and Twitter card images.
  // ogImage: 'img/muster-logo.png',
  // twitterImage: 'img/muster-logo.png',
  gaTrackingId: 'UA-129699840-1',
  gaGtag: true,

  // You may provide arbitrary config keys to be used as needed by your
  // template. For example, if you need your repo's URL...
  repoUrl,
};

module.exports = siteConfig;
