const {DynamoDB, Lambda} = require('aws-sdk');

exports.handler = async function(event) {
    console.log("request:", JSON.stringify(event, undefined, 2));

    const dynamo = new DynamoDB();
    const lambda = new Lambda();

    // Update our hit counter for the given path
    await dynamo.updateItem({
        TableName: process.env.HITS_TABLE_NAME,
        Key: { path: { S: event.path } },
        UpdateExpression: 'ADD hits :incr',
        ExpressionAttributeValues: { ':incr': { N: '1' } }
    }).promise();

    // Call downstream functions. Split the path by "/" to get the downstream function name.
    const downstreamFunctionName = process.env.DOWNSTREAM_FUNCTION_NAME;
    const downstreamFunctionNameParts = downstreamFunctionName.split('/');
    const functionName = downstreamFunctionNameParts[downstreamFunctionNameParts.length - 1];
    const resp = await lambda.invoke({
        FunctionName: functionName,
        Payload: JSON.stringify(event)
    }).promise();

    console.log('downstream response:', JSON.stringify(resp, undefined, 2));

    // Return the response from the downstream function.
    return JSON.parse(resp.Payload);
}