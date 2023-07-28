import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class ChoiceMap extends cdk.Stack {
    public Machine: sfn.CfnStateMachine;
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Step 1: Create the DynamoDB Table
        const ddbTable = new dynamodb.Table(this, 'DDBTable', {
            partitionKey: {
                name: 'id',
                type: dynamodb.AttributeType.STRING,
            },
            readCapacity: 1,
            writeCapacity: 1,
            tableName: 'MapStateTable',
        });

        // Step 2: Create the IAM Role for Step Functions Execution
        const statesExecutionRole = new iam.Role(this, 'StatesExecutionRole', {
            assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
            path: '/',
        });

        // Step 3: Add the necessary permissions to the IAM Role
        statesExecutionRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ['dynamodb:PutItem'],
                resources: [ddbTable.tableArn],
            })
        );
        const stateMachineDefinition = {
            "Comment": "A description of my state machine",
            "StartAt": "Iterate Over Input Array",
            "States": {
                "Iterate Over Input Array": {
                    "Type": "Map",
                    "ItemProcessor": {
                        "ProcessorConfig": {
                            "Mode": "INLINE"
                        },
                        "StartAt": "Priority Filter",
                        "States": {
                            "Priority Filter": {
                                "Type": "Choice",
                                "Choices": [
                                    {
                                        "Variable": "$.priority",
                                        "StringEquals": "LOW",
                                        "Next": "Low Priority Order Detected"
                                    },
                                    {
                                        "Variable": "$.priority",
                                        "StringEquals": "HIGH",
                                        "Next": "Insert High Priority Order"
                                    }
                                ]
                            },
                            "Low Priority Order Detected": {
                                "Type": "Succeed"
                            },
                            "Insert High Priority Order": {
                                "Type": "Task",
                                "Resource": "arn:aws:states:::dynamodb:putItem",
                                "Parameters": {
                                    "TableName": "MapStateTable",
                                    "Item": {
                                        "id": {
                                            "S.$": "$.orderId"
                                        },
                                        "customerId": {
                                            "S.$": "$.customerId"
                                        },
                                        "priority": {
                                            "S.$": "$.priority"
                                        }
                                    }
                                },
                                "End": true
                            }
                        }
                    },
                    "End": true,
                    "ItemsPath": "$.Data",
                    "MaxConcurrency": 1
                }
            }
        };

        this.Machine = new sfn.CfnStateMachine(
            this,
            "choiceMap",
            {
                roleArn: statesExecutionRole.roleArn,
                definitionString: JSON.stringify(stateMachineDefinition),
                stateMachineName: "choiceMap",
            }
        );
    }
}