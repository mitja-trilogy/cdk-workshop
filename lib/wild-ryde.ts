import { Stack, StackProps } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscription from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cdk from "aws-cdk-lib";

export class CdkWildRyde extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'Rides', {
      partitionKey: {name: 'id', type: dynamodb.AttributeType.STRING},
      deletionProtection: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const topic : sns.Topic = new sns.Topic(this, 'RideCompletitionTopic', {
      displayName: 'Ride Completition Topic',
    });

    const customerNotification = new lambda.Function(this, 'notification', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'customerNotification.handler',
      description: 'Sample notification function',
    });

    const customerAccounting = new lambda.Function(this, 'accounting', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'customerAccounting.handler',
      description: 'Sample accounting function',
    });

    const customerExtraordinary = new lambda.Function(this, 'extraordinary', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'customerExtraordinary.handler',
      description: 'Sample extraordinary function',
      reservedConcurrentExecutions: undefined,
    });

    const unicornService = new lambda.Function(this, 'unicorn', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'unicornService.handler',
      description: 'Unicorn service function',
      reservedConcurrentExecutions: undefined,
      environment: {
        TOPIC_ARN: topic.topicArn,
        TABLE_NAME: table.tableName
      }
    });



    new apigw.LambdaRestApi(this, 'Endpoint', {
      handler: unicornService,
    });

    topic.addSubscription(new subscription.LambdaSubscription(customerNotification));
    topic.addSubscription(new subscription.LambdaSubscription(customerAccounting));
    topic.addSubscription(new subscription.LambdaSubscription(customerExtraordinary));

    table.grantReadWriteData(unicornService);
    topic.grantPublish(unicornService);

    };
}