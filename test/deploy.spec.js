describe.skip('Deploy', () => {

    const deploy = require(SRC_HOME + '/deploy')
    let convo;

    before(() => {
        convo = new deploy.Conversation();
    })

    it('should listen for deploy command in direct message or mention', () => {
        convo.listen(controller);
    })

    class MockController {

    

    }


})