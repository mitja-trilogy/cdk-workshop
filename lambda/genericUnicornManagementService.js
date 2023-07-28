const AWS = require("aws-sdk");
const { random } = require("lodash");

const SERVICE_NAME = process.env.SERVICE_NAME;
const QUEUE_URL = process.env.QUEUE_URL;

// const sqsConfig = {
//     region: "us-east-1", // Replace with your desired AWS region
//     maxAttempts: 1,
//     timeout: 5000, // Timeout in milliseconds (5 seconds)
// };

const sqs = new AWS.SQS();

function i_am_not_available(event) {
    return random([true, false]);
}

exports.handler = async (event, context) => {
    console.log(`${SERVICE_NAME} received event: ${JSON.stringify(event)}`);

    // We only send a quote if we are available at that time
    if (i_am_not_available(event)) {
        return;
    }

    // If we send a quote, we wait between 0 and 60 seconds to mimic the quote computation
    await new Promise((resolve) => setTimeout(resolve, random(0, 60) * 1000));

    // Send the response to the quotes response queue
    const message = JSON.parse(event.Records[0].Sns.Message);
    const response_message = JSON.stringify({
        responder: SERVICE_NAME,
        "rfq-id": message["rfq-id"],
        quote: random(0, 100),
    });

    const params = {
        QueueUrl: QUEUE_URL,
        MessageBody: response_message,
    };

    try {
        const response = await sqs.sendMessage(params).promise();
        console.log(`Sent SQS message: ${response_message}`);
    } catch (err) {
        console.error("Error sending SQS message:", err);
    }
}