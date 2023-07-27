# Welcome to your CDK TypeScript project

You should explore the contents of this project. It demonstrates a CDK app with an instance of a stack (`CdkWorkshopStack`)
which contains an Amazon SQS queue that is subscribed to an Amazon SNS topic.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template



    const unicornService = new lambdaNodejs.NodejsFunction(this, 'unicorn', {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: path.join(__dirname, '..', 'lambda', 'unicornService.js'),
      handler: 'handler',
      description: 'Unicorn service function',
      reservedConcurrentExecutions: undefined,
      environment: {
        TOPIC_ARN: topic.topicArn,
        TABLE_NAME: table.tableName
      },
      bundling: {
        externalModules: ['uuid'],
      }
    });