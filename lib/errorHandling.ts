import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from "aws-cdk-lib/aws-lambda";

export class ErrorHandling extends cdk.Stack {
    public Machine: sfn.CfnStateMachine;
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const lambdaErrorHandling = new lambda.Function(this, 'lambdaErrorHandling', {
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'errorHandling.handler',
            timeout: cdk.Duration.seconds(25),
        });

        const lambdaErrorTimeout = new lambda.Function(this, 'lambdaErrorTimeout', {
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'errorHandlingSleep.handler',
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
        const stateMachineDefinitionRetry = {
            "Comment": "A state machine calling an AWS Lambda function with Retry",
            "StartAt": "StartExecution",
            "States": {
                "StartExecution": {
                    "Type": "Task",
                    "Resource": lambdaErrorHandling.functionArn,
                    "Retry": [
                        {
                            "ErrorEquals": [
                                "CustomError"
                            ],
                            "IntervalSeconds": 1,
                            "MaxAttempts": 2,
                            "BackoffRate": 2
                        }
                    ],

                    "End": true
                }
            }
        };

        this.Machine = new sfn.CfnStateMachine(
            this,
            "retry",
            {
                roleArn: statesExecutionRole.roleArn,
                definitionString: JSON.stringify(stateMachineDefinitionRetry),
                stateMachineName: "retry",
            }
        );

        const stateMachineDefinitionCatch = {
            "Comment": "A state machine calling an AWS Lambda function with Catch",
            "StartAt": "StartExecution",
            "States": {
                "StartExecution": {
                    "Type": "Task",
                    "Resource": lambdaErrorTimeout.functionArn,
                    "TimeoutSeconds": 5,
                    "Catch": [ {
                        "ErrorEquals": ["CustomError"],
                        "Next": "CustomErrorFallback"
                    }, {
                        "ErrorEquals": ["States.Timeout"],
                        "Next": "TimeoutFallback"
                    }, {
                        "ErrorEquals": ["States.ALL"],
                        "Next": "CatchAllFallback"
                    } ],
                    "End": true
                },
                "CustomErrorFallback": {
                    "Type": "Pass",
                    "Result": "This is a fallback from a custom Lambda function exception",
                    "End": true
                },
                "TimeoutFallback": {
                    "Type": "Pass",
                    "Result": "This is a fallback from a timeout error",
                    "End": true
                },
                "CatchAllFallback": {
                    "Type": "Pass",
                    "Result": "This is a fallback from any error",
                    "End": true
                }
            }
        };


        let MachineCatch = new sfn.CfnStateMachine(
            this,
                "catch",
                {
                    roleArn: statesExecutionRole.roleArn,
                    definitionString: JSON.stringify(stateMachineDefinitionCatch),
                    stateMachineName: "catch",
                }
        );
    }
}