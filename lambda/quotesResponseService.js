const AWS = require("aws-sdk");

const TABLE_NAME = process.env.TABLE_NAME;

const dynamodb = new AWS.DynamoDB();

exports.handler = async (event, context) => {
    console.log("received event: ", JSON.stringify(event));

    // We configured the event source to only receive one message at a time
    const msg = JSON.parse(event.Records[0].body);

    // Store the received response message in our DynamoDB table for the given rfq-id
    const params = {
        TableName: TABLE_NAME,
        Item: {
            id: { S: msg["rfq-id"] },
            responder: { S: msg["responder"] },
            quote: { N: String(msg["quote"]) },
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

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Item added to DynamoDB successfully" }),
    };
}