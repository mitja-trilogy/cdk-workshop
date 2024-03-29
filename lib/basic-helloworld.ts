import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {Stack, StackProps} from "aws-cdk-lib";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";


export class BasicHelloWorld extends cdk.Stack {
    public Machine: sfn.StateMachine;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const definition = new sfn.Wait(this, "Wait for $.waitSeconds Second", {
                    time: sfn.WaitTime.secondsPath('$.waitSeconds'),
                })
            .next(
                new sfn.Succeed(this, "Succeed")
            );

        this.Machine = new sfn.StateMachine(this, "StateMachine", {
            definition: definition,
            timeout: cdk.Duration.minutes(1),
        });
    }
}