import url from 'url';

const boundaryString = '1439751438138';
const boundarySeparator = '--';
const newLine = '\r\n';
const httpVersion = 'HTTP/1.1';
const contentType = 'Content-Type';

const parseUrl = function(urlString) {
  return url.parse(urlString);
};

const buildRequest = (req, serialize) => {
  let body = [];
  const {pathname, host} = parseUrl(req.url);
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
  if (req._data) {
    if (req.header[contentType] && serialize[req.header[contentType]]) {
      body.push(serialize[req.header[contentType]](req._data))
    } else {
      body.push(serialize(req._data));
    }
  }
  body.push('');
  return body.join(newLine);
};

const createBatchingAgent = function(superagent, containerRequest) {
  let batches = [];

  class BatchingAgent extends superagent {
  }

  let oldEnd = BatchingAgent.Request.prototype.end;
  BatchingAgent.endBatch = function(callback) {
    BatchingAgent.Request.prototype.end = oldEnd;
    console.log(batches);

    let requests = batches.map((req) => buildRequest(req, this.serialize));
    requests.push(boundarySeparator + boundaryString + boundarySeparator);

    console.log(requests);
    containerRequest.send(requests.join(newLine));
    containerRequest.end((err, res) => {
      //callback(err, res);
    });
  };
  BatchingAgent.Request.prototype.end = function end(callback) {
    this._callback = callback;
    batches.push(this);
    return BatchingAgent;
  };
  return BatchingAgent;
};

const superagentBatch = function(superagent) {
  superagent.Request.prototype.startBatch = function() {
    this.set('Content-Type', `multipart/mixed; boundary=${boundaryString}`);
    return createBatchingAgent(superagent, this);
  };
  return superagent;
};

export default superagentBatch;
