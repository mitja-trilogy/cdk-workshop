import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from 'aws-cdk-lib/aws-apigateway';

export class Parallel extends cdk.Stack {
    public Machine: sfn.CfnStateMachine;
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const lambdaAvg = new lambda.Function(this, 'ParallelAVG', {
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'avg.handler',
            timeout: cdk.Duration.seconds(25),
        });

        const lambdaSum = new lambda.Function(this, 'ParallelSUM', {
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'sum.handler',
            timeout: cdk.Duration.seconds(25),
        });

        const lambdaMaxMin = new lambda.Function(this, 'ParallelMaxMin', {
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'maxmin.handler',
            timeout: cdk.Duration.seconds(25),
        });

        const statesExecutionRole = new iam.Role(this, 'StatesExecutionRole', {
            assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
            path: '/',
        });

        statesExecutionRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ['cloudwatch:*', 'logs:*', 'lambda:*'],
                resources: ['*'],
            })
        );
        const stateMachineDefinition = {
            "Comment": "A description of my state machine",
            "StartAt": "Parallel",
            "States": {
                "Parallel": {
                    "Type": "Parallel",
                    "End": true,
                    "Branches": [
                        {
                            "StartAt": "Sum",
                            "States": {
                                "Sum": {
                                    "Type": "Task",
                                    "Resource": "arn:aws:states:::lambda:invoke",
                                    "Parameters": {
                                        "Payload.$": "$",
                                        "FunctionName": "arn:aws:lambda:us-east-1:856284715153:function:Callback-ParallelSUM8081962E-kEVv09B5ObsY:$LATEST"
                                    },
                                    "Retry": [
                                        {
                                            "ErrorEquals": [
                                                "Lambda.ServiceException",
                                                "Lambda.AWSLambdaException",
                                                "Lambda.SdkClientException",
                                                "Lambda.TooManyRequestsException"
                                            ],
                                            "IntervalSeconds": 2,
                                            "MaxAttempts": 6,
                                            "BackoffRate": 2
                                        }
                                    ],
                                    "End": true,
                                    "ResultSelector": {
                                        "sum.$": "$.Payload.sum"
                                    }
                                }
                            }
                        },
                        {
                            "StartAt": "Avg",
                            "States": {
                                "Avg": {
                                    "Type": "Task",
                                    "Resource": "arn:aws:states:::lambda:invoke",
                                    "Parameters": {
                                        "Payload.$": "$",
                                        "FunctionName": "arn:aws:lambda:us-east-1:856284715153:function:Callback-ParallelAVGEA6FC2CA-bHIufnotmqhB:$LATEST"
                                    },
                                    "Retry": [
                                        {
                                            "ErrorEquals": [
                                                "Lambda.ServiceException",
                                                "Lambda.AWSLambdaException",
                                                "Lambda.SdkClientException",
                                                "Lambda.TooManyRequestsException"
                                            ],
                                            "IntervalSeconds": 2,
                                            "MaxAttempts": 6,
                                            "BackoffRate": 2
                                        }
                                    ],
                                    "End": true,
                                    "ResultSelector": {
                                        "avg.$": "$.Payload.avg"
                                    }
                                }
                            }
                        },
                        {
                            "StartAt": "MAxMin",
                            "States": {
                                "MAxMin": {
                                    "Type": "Task",
                                    "Resource": "arn:aws:states:::lambda:invoke",
                                    "Parameters": {
                                        "Payload.$": "$",
                                        "FunctionName": "arn:aws:lambda:us-east-1:856284715153:function:Callback-ParallelMaxMin0457EAAD-G8L7OJTTsWCm:$LATEST"
                                    },
                                    "Retry": [
                                        {
                                            "ErrorEquals": [
                                                "Lambda.ServiceException",
                                                "Lambda.AWSLambdaException",
                                                "Lambda.SdkClientException",
                                                "Lambda.TooManyRequestsException"
                                            ],
                                            "IntervalSeconds": 2,
                                            "MaxAttempts": 6,
                                            "BackoffRate": 2
                                        }
                                    ],
                                    "End": true,
                                    "ResultSelector": {
                                        "max.$": "$.Payload.max",
                                        "min.$": "$.Payload.min"
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        };

        const mapStateStateMachine = new sfn.StateMachine(this, 'ParallelStateMachine', {
            definitionBody: sfn.DefinitionBody.fromString(JSON.stringify(stateMachineDefinition)),
            role: statesExecutionRole,
            stateMachineName: "ParallelStateMachine",
            stateMachineType: sfn.StateMachineType.EXPRESS,
        });

        new apigw.StepFunctionsRestApi(this, 'Endpoint', {
            stateMachine: mapStateStateMachine,
        });


    }
}