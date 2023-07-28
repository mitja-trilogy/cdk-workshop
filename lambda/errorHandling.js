exports.handler = async (event, context, callback) => {

    function FooError(message) {
        this.name = 'CustomError';
        this.message = message;
    }
    FooError.prototype = new Error();

    throw new FooError('This is a custom error!');
};