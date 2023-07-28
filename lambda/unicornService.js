const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const TABLE_NAME = process.env.TABLE_NAME;
const TOPIC_ARN = process.env.TOPIC_ARN;

const dynamodb = new AWS.DynamoDB();
const sns = new AWS.SNS({ apiVersion: '2010-03-31' });
// const sns = new AWS.SNS();

function isInvalid(request) {
    // TODO: validate request
    return false;
}

exports.handler = async (event, context) => {
    console.log('EVENT: ', JSON.stringify(event));

    const request = JSON.parse(event.body);
    console.log('The request loaded ', request);

    if (isInvalid(request)) {
        return {
            statusCode: 400,
            body: JSON.stringify({})
        };
    }

    console.log('Request is valid!');

    const id = uuidv4();
    console.log('id: ', id);
    request.id = id;

    const putParams = {
        TableName: TABLE_NAME,
        Item: {
            id: { S: id },
            from: { S: request.from },
            to: { S: request.to },
            duration: { N: String(request.duration) },
            distance: { N: String(request.distance) },
            customer: { S: request.customer },
            fare: { N: String(request.fare) }
        }
    };

    try {
        await dynamodb.putItem(putParams).promise();

        const snsParams = {
            TopicArn: TOPIC_ARN,
            Message: JSON.stringify(request),
            MessageAttributes: {
                'fare': {
                    DataType: 'Number',
                    StringValue: String(request.fare)
                },
                'distance': {
                    DataType: 'Number',
                    StringValue: String(request.distance)
                }
            }
        };
        await sns.publish(snsParams).promise();

        return {
            statusCode: 201,
            body: JSON.stringify({ id })
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
};