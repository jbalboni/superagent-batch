import superagentBatch from '../../src/superagent-batch';

describe('superagentBatch', () => {
  describe('Greet function', () => {
    beforeEach(() => {
      spy(superagentBatch, 'greet');
      superagentBatch.greet();
    });

    it('should have been run once', () => {
      expect(superagentBatch.greet).to.have.been.calledOnce;
    });

    it('should have always returned hello', () => {
      expect(superagentBatch.greet).to.have.always.returned('hello');
    });
  });
});
