/**
 * @fileoverview HTML reporter
 * @author Julian Laval
 */

const lodash = require('lodash');
const fs = require('fs');
const path = require('path');
const stylish = require('./stylish');
const icons = [
  '<svg class="icon icon--success" viewBox="0 0 512 512"><path d="M256 48C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48zm106.5 150.5L228.8 332.8h-.1c-1.7 1.7-6.3 5.5-11.6 5.5-3.8 0-8.1-2.1-11.7-5.7l-56-56c-1.6-1.6-1.6-4.1 0-5.7l17.8-17.8c.8-.8 1.8-1.2 2.8-1.2 1 0 2 .4 2.8 1.2l44.4 44.4 122-122.9c.8-.8 1.8-1.2 2.8-1.2 1.1 0 2.1.4 2.8 1.2l17.5 18.1c1.8 1.7 1.8 4.2.2 5.8z"></path></svg>',
  '<svg class="icon icon--warning" viewBox="0 0 512 512"><path d="M256 48C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48zm19 304h-38.2V207.9H275V352zm-19.1-159.8c-11.3 0-20.5-8.6-20.5-20s9.3-19.9 20.5-19.9c11.4 0 20.7 8.5 20.7 19.9s-9.3 20-20.7 20z"></path></svg>',
  '<svg class="icon icon--error" viewBox="0 0 512 512"><path d="M256 48C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48zm52.7 283.3L256 278.6l-52.7 52.7c-6.2 6.2-16.4 6.2-22.6 0-3.1-3.1-4.7-7.2-4.7-11.3 0-4.1 1.6-8.2 4.7-11.3l52.7-52.7-52.7-52.7c-3.1-3.1-4.7-7.2-4.7-11.3 0-4.1 1.6-8.2 4.7-11.3 6.2-6.2 16.4-6.2 22.6 0l52.7 52.7 52.7-52.7c6.2-6.2 16.4-6.2 22.6 0 6.2 6.2 6.2 16.4 0 22.6L278.6 256l52.7 52.7c6.2 6.2 6.2 16.4 0 22.6-6.2 6.3-16.4 6.3-22.6 0z"></path></svg>'
]

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const pageTemplate = lodash.template(
  fs.readFileSync(path.join(__dirname, 'html-template-page.html'), 'utf-8'),
);
const messageTemplate = lodash.template(
  fs.readFileSync(path.join(__dirname, 'html-template-message.html'), 'utf-8'),
);
const resultTemplate = lodash.template(
  fs.readFileSync(path.join(__dirname, 'html-template-result.html'), 'utf-8'),
);
const projectSrc = path.resolve(__dirname).replace('eslint-formatter-html-extended/src', '')
/**
 * Given a word and a count, append an s if count is not one.
 * @param {string} word A word in its singular form.
 * @param {int} count A number controlling whether word should be pluralized.
 * @returns {string} The original word with an s on the end if count is not one.
 */
function pluralize(word, count) {
  return count === 1 ? word : `${word}s`;
}

/**
 * Renders text along the template of x problems (x errors, x warnings)
 * @param {string} totalErrors Total errors
 * @param {string} totalWarnings Total warnings
 * @returns {string} The formatted string, pluralized where necessary
 */
function renderSummary(totalErrors, totalWarnings) {
  const totalProblems = totalErrors + totalWarnings;
  let renderedText = `${totalProblems} ${pluralize('problem', totalProblems)}`;

  if (totalProblems !== 0) {
    renderedText += ` (${totalErrors} ${pluralize(
      'error',
      totalErrors,
    )}, ${totalWarnings} ${pluralize('warning', totalWarnings)})`;
  }
  return renderedText;
}

/**
 * Get the color based on whether there are errors/warnings...
 * @param {string} totalErrors Total errors
 * @param {string} totalWarnings Total warnings
 * @returns {int} The color code (0 = green, 1 = yellow, 2 = red)
 */
function renderColor(totalErrors, totalWarnings) {
  if (totalErrors !== 0) {
    return 2;
  }
  if (totalWarnings !== 0) {
    return 1;
  }
  return 0;
}

/**
 * Get HTML (table rows) describing the messages.
 * @param {Array} messages Messages.
 * @param {int} parentIndex Index of the parent HTML row.
 * @returns {string} HTML (table rows) describing the messages.
 */
function renderMessages(messages, parentIndex) {
  /**
   * Get HTML (table row) describing a message.
   * @param {Object} message Message.
   * @returns {string} HTML (table row) describing a message.
   */
  return lodash
    .map(messages, (message) => {
      const lineNumber = message.line || 0;
      const columnNumber = message.column || 0;

      return messageTemplate({
        parentIndex,
        lineNumber,
        columnNumber,
        severityNumber: message.severity,
        severityName: message.severity === 1 ? 'Warning' : 'Error',
        severityIcon: icons[message.severity],
        message: message.message,
        ruleId: message.ruleId,
      });
    })
    .join('\n');
}

/**
 * @param {Array} results Test results.
 * @returns {string} HTML string describing the results.
 */
function renderResults(results) {
  return lodash
    .map(results, (result, index) => {
      const color = renderColor(result.errorCount, result.warningCount);

      return resultTemplate({
        index,
        color,
        icon: icons[color],
        filePath: result.filePath.replace(projectSrc, ''),
        summary: renderSummary(result.errorCount, result.warningCount),
      }) + renderMessages(result.messages, index)
    })
    .join('\n');
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

// eslint-disable-next-line func-names
module.exports = function (results) {
  let totalErrors;
  let totalWarnings;
  totalErrors = 0;
  totalWarnings = 0;

  // Iterate over results to get totals
  results.forEach((result) => {
    totalErrors += result.errorCount;
    totalWarnings += result.warningCount;
  });

  const a = stylish(results);
  console.log(a);

  return pageTemplate({
    date: new Date(),
    reportColor: renderColor(totalErrors, totalWarnings),
    reportSummary: renderSummary(totalErrors, totalWarnings),
    results: renderResults(results),
  });
};
