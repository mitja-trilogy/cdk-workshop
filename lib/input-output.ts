import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from 'aws-cdk-lib/aws-apigateway';

export class InputOutput extends cdk.Stack {
    public Machine: sfn.CfnStateMachine;
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const lambdaReq = new lambda.Function(this, 'req', {
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'requestResponse.handler',
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
        const stateMachineDefinition =
            {
                "Comment": "A description of my state machine",
                "StartAt": "Invoke sample",
                "States": {
                    "Invoke sample": {
                        "Type": "Task",
                        "Resource": "arn:aws:states:::lambda:invoke",
                        "Parameters": {
                            "Payload.$": "$",
                            "FunctionName": "arn:aws:lambda:us-east-1:856284715153:function:Callback-req96DDE0A5-FztEPoGlfDi4:$LATEST"
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
                        "InputPath": "$.lambda",
                        "ResultPath": "$.data.lambdaresult",
                        "OutputPath": "$.data",
                        "Next": "Pass"
                    },
                    "Pass": {
                        "Type": "Pass",
                        "End": true,
                        "Parameters": {
                            "Sum.$": "States.MathAdd($.value1, $.value2)"
                        }
                    }
                }
            };


        const mapStateStateMachine = new sfn.StateMachine(this, 'RequestStateMachine', {
            definitionBody: sfn.DefinitionBody.fromString(JSON.stringify(stateMachineDefinition)),
            role: statesExecutionRole,
            stateMachineName: "RequestStateMachine",
            stateMachineType: sfn.StateMachineType.EXPRESS,
        });

    }
}