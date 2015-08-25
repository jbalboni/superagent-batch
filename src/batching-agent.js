import url from 'url';
import {boundarySeparator, boundaryString, contentType, newLine, httpVersion} from './constants';
import parseBatchedResponse from 'batched-response-parser.js';
import request from 'superagent';

function buildRequest(req) {
  let body = [];
  const {pathname, host} = url.parse(req.url);
  const query = req._query.length ? `?${req._query.join('&')}` : '';

  body.push(boundarySeparator + boundaryString);
  body.push('Content-Type: application/http; msgtype=request');

  body.push('');

  body.push(`${req.method} ${pathname}${query} ${httpVersion}`);

  if (host === null && !window) {
    throw ('Couldn\'t determine host name for batched request');
  }

  body.push(`Host: ${host || window.location.host}`);

  Object.keys(req.header).forEach((header) => body.push(`${header}: ${req.header[header]}`));

  body.push('');

  if (req._serializedData) {
    body.push(req._serializedData);
  }

  body.push('');

  return body.join(newLine);
}

export default function createBatchingAgent(containerRequest) {
  let batches = [];

  class BatchingAgent extends request {}

  let oldEnd = BatchingAgent.Request.prototype.end;
  BatchingAgent.endBatch = function(callback) {
    BatchingAgent.Request.prototype.end = oldEnd;

    let requests = batches.map((req) => buildRequest(req));
    requests.push(boundarySeparator + boundaryString + boundarySeparator);

    containerRequest.send(requests.join(newLine));
    containerRequest.end((err, res) => {
      let responses = parseBatchedResponse(batches, res);
      responses.forEach((resp) => {
        if (resp.req._callback) {
          resp.req._callback(resp.toError(), resp);
        }
      });

      if (callback) {
        callback(err, res);
      }
    });
  };

  BatchingAgent.Request.prototype.end = function end(callback) {
    if (this._data) {
      let serializer = BatchingAgent.serialize[this.header[contentType]];
      if (this.header[contentType] && serializer) {
        this._serializedData = serializer(this._data);
      } else {
        this._serializedData = this._data;
      }
    }

    this._callback = callback;
    batches.push(this);
    return BatchingAgent;
  };

  return BatchingAgent;
}
