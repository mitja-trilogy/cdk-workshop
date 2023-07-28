#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkWildRyde } from '../lib/wild-ryde';
import { CdkWorkshopStack } from '../lib/cdk-workshop-stack';
import {lab3} from "../lib/lab3";

const app = new cdk.App();
new lab3(app, 'lab3', {
    tags: {
        "Owner": "mitja.resek",
    }
});
