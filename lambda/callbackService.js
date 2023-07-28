var AWS = require('aws-sdk');
var stepfunctions = new AWS.StepFunctions({apiVersion: '2016-11-23'});
exports.handler = async(event, context, callback) => {
    for (const record of event.Records) {
        const messageBody = JSON.parse(record.body);
        const taskToken = messageBody.TaskToken;
        const params = {
            output: "\"Callback task completed successfully.\"",
            taskToken: taskToken
        };
        console.log(`Calling Step Functions to complete callback task with params`);
        console.log(JSON.stringify(params));
        let response = await stepfunctions.sendTaskSuccess(params).promise();
    }
};