#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkWildRyde } from '../lib/wild-ryde';

const app = new cdk.App();
new CdkWildRyde(app, 'CdkWildRyde', {
    tags: {
        "Owner": "856284715153",
    }
});
