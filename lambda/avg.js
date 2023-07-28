const AWS = require("aws-sdk");
exports.handler = async(event, context, callback) => {
    console.log(event);
    let data = JSON.parse(event.body.input)
    console.log(data);
    const sum = data['data'].reduce((partialSum, a) => partialSum + a, 0);
    return {
        "avg": sum / data['data'].length
    }
};