import request from 'superagent';

export default function BatchResponse(req, parsedResponse) {
  this.req = req;
  this.text = parsedResponse.body;
  this.statusText = parsedResponse.statusMessage;
  this.setStatusProperties(parseInt(parsedResponse.status));
  this.header = this.headers = parsedResponse.headers;
  this.setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD' ? this.parseBody(this.text) : null;
}

BatchResponse.prototype = request.Response.prototype;
