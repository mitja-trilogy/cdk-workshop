

import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import {Stack, StackProps} from "aws-cdk-lib";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";


export class BasicHelloWorld extends cdk.Stack {
    public Machine: sfn.StateMachine;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const definition = new sfn.Wait(this, "Wait 1 Second", {
                    time: sfn.WaitTime.secondsPath('$.waitSeconds'),
                })
            .next(
                new sfn.Succeed(this, "Succeed")
            );

        this.Machine = new sfn.StateMachine(this, "StateMachine", {
            definition: definition,
            timeout: cdk.Duration.minutes(1),
        });

        const stateMachineDefinition = {
            Comment: 'An example of the Amazon States Language for scheduling a task.',
            StartAt: 'Wait for Timer',
            States: {
                'Wait for Timer': {
                    Type: 'Wait',
                    SecondsPath: '$.timer_seconds',
                    Next: 'Success',
                },
                'Success': {
                    Type: 'Succeed',
                },
            },
        };
        
    }
}