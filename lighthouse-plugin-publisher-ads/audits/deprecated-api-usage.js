// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n');
const {Audit} = require('lighthouse');
const {isGpt} = require('../utils/resource-classification');

const UIStrings = {
  title: 'Deprecated GPT API Usage',
  failureTitle: 'Avoid deprecated GPT APIs',
  description: 'Deprecated GPT API methods should be avoided to ensure your ' +
  'page is tagged correctly. [Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/deprecated-gpt-api-usage' +
  ').',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

/**
 * Audit that checks for the presence of warning and error messages which
 * pertain to deprecated API usage.
 */
class DeprecatedApiUsage extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'deprecated-gpt-api-usage',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['ConsoleMessages'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @return {LH.Audit.Product}
   */
  static audit(artifacts) {
    /** @type {Array<{
     * source: string,
     * description: string|undefined,
     * url: string|undefined,
     * timestamp: number|undefined}>} */
    const tableRows = artifacts.ConsoleMessages
        .filter((item) => item.level === 'warning' || item.level === 'error')
        .filter((item) => item.url && isGpt(item.url))
        .filter((item) =>
          item.text.toLowerCase().includes('deprecated') ||
          item.text.toLowerCase().includes('discouraged'))
        .map((item) => ({
          source: item.source,
          description: item.text,
          url: item.url,
          timestamp: item.timestamp,
        }))
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    /** @type {LH.Audit.Details.Table['headings']} */
    const headings = [
      {key: 'url', itemType: 'url', text: str_(i18n.UIStrings.columnURL)},
      {key: 'description', itemType: 'code', text: str_(i18n.UIStrings.columnDescription)},
    ];

    const details = Audit.makeTableDetails(headings, tableRows);
    const numErrors = tableRows.length;

    return {
      score: Number(numErrors === 0),
      details,
    };
  }
}

module.exports = DeprecatedApiUsage;
module.exports.UIStrings = UIStrings;