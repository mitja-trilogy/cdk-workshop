const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const TABLE_NAME = process.env.TABLE_NAME;
const TOPIC_ARN = process.env.TOPIC_ARN;

const dynamodb = new AWS.DynamoDB();
const sns = new AWS.SNS({ apiVersion: '2010-03-31' });

function is_invalid(request) {
    // TODO: Validate all input fields
    // request['from']
    return false;
}

exports.handler = async (event, context) => {
    console.log("received event: ", JSON.stringify(event));

    const request = JSON.parse(event.body);

    if (is_invalid(request)) {
        return {
            statusCode: 400,
            body: JSON.stringify({}),
        };
    }

    const rfq_id = uuidv4();
    request["rfq-id"] = rfq_id;

    const params = {
        TableName: TABLE_NAME,
        Item: {
            id: { S: request["rfq-id"] },
            responder: { S: "-" },
            from: { S: request["from"] },
            to: { S: request["to"] },
            customer: { S: request["customer"] },
        },
    };

    try {
        await dynamodb.putItem(params).promise();
    } catch (err) {
        console.error("Error putting item in DynamoDB:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }

    const snsParams = {
        TopicArn: TOPIC_ARN,
        Message: JSON.stringify(request),
    };

    try {
        await sns.publish(snsParams).promise();
    } catch (err) {
        console.error("Error publishing to SNS:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }

    return {
        statusCode: 201,
        body: JSON.stringify({
            "rfq-id": rfq_id,
        }),
    };
}
