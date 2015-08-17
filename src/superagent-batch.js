import url from 'url';
import createBatchingAgent from './batching-agent';
import {boundaryString, contentType} from './constants.js';

const superagentBatch = function(superagent) {
  superagent.Request.prototype.startBatch = function() {
    this.set(contentType, `multipart/mixed; boundary=${boundaryString}`);
    return createBatchingAgent(this);
  };
  return superagent;
};

export default superagentBatch;
