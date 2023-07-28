import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {Stack, StackProps} from "aws-cdk-lib";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as iam from 'aws-cdk-lib/aws-iam';


export class DetectSentiment extends cdk.Stack {
    public Machine: sfn.CfnStateMachine;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        // Step 4: Create the Step Function State Machine
        const stateMachineDefinition = {
            "Comment": "A description of my state machine",
            "StartAt": "DetectSentiment",
            "States": {
                "DetectSentiment": {
                    "Type": "Task",
                    "End": true,
                    "Parameters": {
                        "LanguageCode": "en",
                        "Text.$": "$.Comment"
                    },
                    "Resource": "arn:aws:states:::aws-sdk:comprehend:detectSentiment"
                }
            }
        };

        const iamRole = new iam.Role(this, 'StatesExecutionRole', {
            assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
            inlinePolicies: {
                ComprehendDetectSentimentPolicy: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            actions: ['comprehend:DetectSentiment'],
                            resources: ['*'],
                        }),
                    ]
                })
            },
        });

        this.Machine = new sfn.CfnStateMachine(
            this,
            "cfnStepFunction",
            {
                roleArn: iamRole.roleArn,
                definitionString: JSON.stringify(stateMachineDefinition),
                stateMachineName: "detectSentiment",
            }
        );

    }
}