
const AWS = require("aws-sdk");

const TABLE_NAME = process.env.TABLE_NAME;

const dynamodb = new AWS.DynamoDB();

function assemble(response) {
    const body = {
        quotes: [],
    };

    response.Items.forEach((item) => {
        if (item.quote) {
            body.quotes.push({
                responder: item.responder.S,
                quote: Number(item.quote.N),
            });
        } else {
            body["rfq-id"] = item.id.S;
            body.from = item.from.S;
            body.to = item.to.S;
            body.customer = item.customer.S;
        }
    });

    return body;
}

exports.handler = async (event, context) => {
    console.log("received event: ", JSON.stringify(event));
    const id = event.pathParameters.proxy;
    console.log("pathParameters: ", event.pathParameters);
    console.log("id: ", id);

    // Query DynamoDB with the rfq-id provided in the request
    const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: {
            ":id": { S: id },
        },
    };

    let response;
    try {
        response = await dynamodb.query(params).promise();
    } catch (err) {
        console.error("Error querying DynamoDB:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }

    const body = assemble(response);

    return {
        statusCode: 200,
        body: JSON.stringify(body),
    };
}
