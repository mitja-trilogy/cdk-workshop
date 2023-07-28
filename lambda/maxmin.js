const AWS = require("aws-sdk");
exports.handler = async(event, context, callback) => {
    console.log(event);
    let data = JSON.parse(event.body.input)
    console.log(data['data']);
    return {
        "max": Math.max(...data['data']),
        "min": Math.min(...data['data'])
    }
};