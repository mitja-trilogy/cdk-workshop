#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkWildRyde } from '../lib/wild-ryde';
import { CdkWorkshopStack } from '../lib/cdk-workshop-stack';
import {lab3} from "../lib/lab3";
import {BasicHelloWorld} from "../lib/basic-helloworld";
import {RequestResponse} from "../lib/request-response";
import {Callback} from "../lib/callback";
import {DetectSentiment} from "../lib/detectSentiment";

const app = new cdk.App();
new DetectSentiment(app, 'Callback', {
    tags: {
        "Owner": "mitja.resek",
    }
});
