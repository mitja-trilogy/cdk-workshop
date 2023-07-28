import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import {Stack, StackProps} from "aws-cdk-lib";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";


export class Callback extends cdk.Stack {
    public Machine: sfn.CfnStateMachine;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const snsTopic = new sns.Topic(this, 'SNSTopic', {
            displayName: 'StepFunctionsTemplate-CallbackTopic',
        });

        const sqsQueue = new sqs.Queue(this, 'SQSQueue', {
            visibilityTimeout: cdk.Duration.seconds(30),
            deadLetterQueue: {
                maxReceiveCount: 1,
                queue: new sqs.Queue(this, 'SQSQueueDLQ', {
                    visibilityTimeout: cdk.Duration.seconds(30),
                }),
            },
        });

        const iamRole = new iam.Role(this, 'StatesExecutionRole', {
            assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
            inlinePolicies: {
                SNSPublishPolicy: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            actions: ['sns:Publish'],
                            resources: [snsTopic.topicArn],
                        }),
                    ],
                }),
                SQSSendMessagePolicy: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            actions: ['sqs:SendMessage'],
                            resources: [sqsQueue.queueArn],
                        }),
                    ],
                }),
            },
        });

        const stateMachineDefinition = {
            Comment: 'An example of the Amazon States Language for starting a task and waiting for a callback.',
            StartAt: 'Start Task And Wait For Callback',
            States: {
                'Start Task And Wait For Callback': {
                    Type: 'Task',
                    Resource: `arn:${this.partition}:states:::sqs:sendMessage.waitForTaskToken`,
                    Parameters: {
                        QueueUrl: sqsQueue.queueUrl,
                        MessageBody: {
                            MessageTitle: 'Task started by Step Functions. Waiting for callback with task token.',
                            'TaskToken.$': '$$.Task.Token',
                        },
                    },
                    Next: 'Notify Success',
                    Catch: [
                        {
                            ErrorEquals: ['States.ALL'],
                            Next: 'Notify Failure',
                        },
                    ],
                },
                'Notify Success': {
                    Type: 'Task',
                    Resource: `arn:${this.partition}:states:::sns:publish`,
                    Parameters: {
                        Message: 'Callback received. Task started by Step Functions succeeded.',
                        TopicArn: snsTopic.topicArn,
                    },
                    End: true,
                },
                'Notify Failure': {
                    Type: 'Task',
                    Resource: `arn:${this.partition}:states:::sns:publish`,
                    Parameters: {
                        Message: 'Task started by Step Functions failed.',
                        TopicArn: snsTopic.topicArn,
                    },
                    End: true,
                },
            },
        };


        this.Machine = new sfn.CfnStateMachine(
            this,
            "cfnStepFunction",
            {
                roleArn: iamRole.roleArn,
                definitionString: JSON.stringify(stateMachineDefinition),
                stateMachineName: "callback",
            }
        );

        const lambdaFunction = new lambda.Function(this, 'CallbackWithTaskToken', {
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'callbackService.handler',
            timeout: cdk.Duration.seconds(25),
            role: new iam.Role(this, 'LambdaExecutionRole', {
                assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
                inlinePolicies: {
                    SQSReceiveMessagePolicy: new iam.PolicyDocument({
                        statements: [
                            new iam.PolicyStatement({
                                actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:GetQueueAttributes', 'sqs:ChangeMessageVisibility'],
                                resources: [sqsQueue.queueArn],
                            }),
                        ],
                    }),
                    CloudWatchLogsPolicy: new iam.PolicyDocument({
                        statements: [
                            new iam.PolicyStatement({
                                actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
                                resources: ['*'],
                            }),
                        ],
                    }),
                    StatesExecutionPolicy: new iam.PolicyDocument({
                        statements: [
                            new iam.PolicyStatement({
                                actions: ['states:SendTaskSuccess', 'states:SendTaskFailure'],
                                resources: [this.Machine.attrArn],
                            }),
                        ],
                    }),
                },
            }),
        });
        sqsQueue.grantSendMessages(lambdaFunction);
        sqsQueue.grantConsumeMessages(lambdaFunction);

        const eventSource = new lambdaEventSources.SqsEventSource(sqsQueue);

        lambdaFunction.addEventSource(eventSource);


    }
}