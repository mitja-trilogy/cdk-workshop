import { Stack, StackProps } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { HitCounter } from './hitcounter';
import { TableViewer} from "cdk-dynamo-table-viewer";

export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const hello = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'hello.handler',
      description: 'Hello World Lambda Function',
    });

    new apigw.LambdaRestApi(this, 'Endpoint', {
      handler: hello,
    });

    const helloWithCounter = new HitCounter(this, 'HelloHitCounter', {
        downstream: hello
    });

    new apigw.LambdaRestApi(this, 'HelloHitCounterEndpoint', {
        handler: helloWithCounter.handler
    });

    new TableViewer(this, 'ViewHitCounter', {
        title: 'Hello Hits',
        table: helloWithCounter.table,
        sortBy: '-hits'
    })

    };
}