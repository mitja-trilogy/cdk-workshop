import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import {Stack, StackProps} from "aws-cdk-lib";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import {SnsPublish} from "aws-cdk-lib/aws-stepfunctions-tasks";


export class RequestResponse extends cdk.Stack {
    public Machine: sfn.StateMachine;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const snsTopic = new sns.Topic(this, 'SNSTopic', {
            displayName: 'RequestResponseTopic',
        });


        const definition = new sfn.Wait(this, "Wait for $.waitSeconds Second", {
            time: sfn.WaitTime.secondsPath('$.waitSeconds'),
        })
            .next(
                new SnsPublish(this, 'Publish Message to SNS Topic', {
                    message: sfn.TaskInput.fromJsonPathAt('$.message'),
                    topic: snsTopic
                })
            )
            .next(
                new sfn.Succeed(this, "Succeed")
            );

        this.Machine = new sfn.StateMachine(this, "StateMachine", {
            definition: definition,
            timeout: cdk.Duration.minutes(1),
        });

        snsTopic.grantPublish(this.Machine);


    }
}