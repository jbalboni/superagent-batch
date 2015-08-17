import {boundarySeparator, contentType, newLine, httpVersion} from './constants';
import BatchResponse from './batch-response.js';

function parseResponse(response) {
  let parsedResponse = {};
  let resp = response.replace(new RegExp('[^]*?' + httpVersion), httpVersion);
  let respLines = resp.split(newLine);
  let [version, status, ...message] = respLines.shift().split(' ');
  parsedResponse.status = status;
  parsedResponse.statusMessage = message.join(' ');
  parsedResponse.headers = {};
  while (respLines[0] !== '') {
    let [name, content] = respLines.shift().split(': ');
    parsedResponse.headers[name.toLowerCase()] = content;
  }
  respLines.shift();
  parsedResponse.body = respLines.shift();
  return parsedResponse;
}

export default parseBatchedResponse = (batches, res) => {
  let separator = '--' + /boundary="(.*)"/.exec(res.header[contentType.toLowerCase()])[1];
  let responses = res.text.split(separator).filter((resp) => resp.replace(newLine, '') !== boundarySeparator && resp.replace(newLine, '').length);
  let superagentResponses = responses.map((resp, i) => {
    let parsedResponse = parseResponse(resp);
    return new BatchResponse(batches[i], parsedResponse);
  });
  return superagentResponses;
};
