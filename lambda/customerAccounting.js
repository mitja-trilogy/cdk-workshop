function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

exports.handler = async (event, context) => {
    try {
        for (const e of event.Records) {
            const message = e.Sns.Message;
            const messageId = e.Sns.MessageId;

            // Will fail randomly to show the AWS Lambda retry feature
            if (randomChoice([true, false])) {
                console.log("--------------------------------------");
                console.log(`{'msg-id': '${messageId}', 'status': 'FAILED'}`);
                console.log("--------------------------------------");
                throw new Error("Unable to process fare");
            } else {
                console.log("+++++++++++++++++++++++++++++++++++++++++");
                console.log(`{'msg-id': '${messageId}', 'status': 'PROCESSED'}`);
                console.log("+++++++++++++++++++++++++++++++++++++++++");
            }
        }
    } catch (error) {
        console.error(error);
        // Handle any error as needed
    }
};