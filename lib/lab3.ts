import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sqsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';

import * as path from 'path';
import { Construct } from 'constructs';
import * as subscription from "aws-cdk-lib/aws-sns-subscriptions";

export class lab3 extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // RidesBookingTable
        const ridesBookingTable = new dynamodb.Table(this, 'RideBokingTable', {
            tableName: `RideBoking-${this.stackName}`,
            partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'responder', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            deletionProtection: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        // RequestForQuotesTopic
        const requestForQuotesTopic = new sns.Topic(this, 'RequestForQuotesTopic');

        // RequestForQuotesResponseQueue
        const requestForQuotesResponseQueue = new sqs.Queue(this, 'RequestForQuotesResponseQueue2', {
            visibilityTimeout: cdk.Duration.seconds(120),
        });

        // RequestForQuotesService
        const requestForQuotesService = new lambda.Function(this, 'RequestForQuotesService', {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'requestForQuotesService.handler',
            environment: {
                TABLE_NAME: ridesBookingTable.tableName,
                TOPIC_ARN: requestForQuotesTopic.topicArn,
            }
        });

        ridesBookingTable.grantReadWriteData(requestForQuotesService);
        requestForQuotesTopic.grantPublish(requestForQuotesService);

        new apigw.LambdaRestApi(this, 'Endpoint', {
            handler: requestForQuotesService,
        });

        // UnicornManagementResources (Generic Unicorn Management Service)

        for (let i = 1; i <= 10; i++) {
            const unicornManagementResource = new lambda.Function(this, `UnicornManagementResource${i}`, {
                runtime: lambda.Runtime.NODEJS_16_X,
                code: lambda.Code.fromAsset('lambda'),
                handler: 'genericUnicornManagementService.handler',
                timeout: cdk.Duration.seconds(120),
                environment: {
                    SERVICE_NAME: `UnicornManagementResource${i}`,
                    QUEUE_URL: requestForQuotesResponseQueue.queueUrl,
                },
            });

            requestForQuotesResponseQueue.grantSendMessages(unicornManagementResource);
            requestForQuotesTopic.addSubscription(new subscription.LambdaSubscription(unicornManagementResource));

        }


        // QuotesResponseService
        const quotesResponseService = new lambda.Function(this, 'QuotesResponseService', {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'quotesResponseService.handler',
            environment: {
                TABLE_NAME: ridesBookingTable.tableName,
            },
        });

        ridesBookingTable.grantReadWriteData(quotesResponseService);

        const eventSource = new lambdaEventSources.SqsEventSource(requestForQuotesResponseQueue);

        quotesResponseService.addEventSource(eventSource);

        // queryForQuotesService
        const queryForQuotesService = new lambda.Function(this, 'QueryForQuotesService', {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'queryForQuotesService.handler',
            environment: {
                TABLE_NAME: ridesBookingTable.tableName,
            },
        });

        new apigw.LambdaRestApi(this, 'QueryEndpoint', {
            handler: queryForQuotesService,
        });
        ridesBookingTable.grantReadData(queryForQuotesService);

    }
}