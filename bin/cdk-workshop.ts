#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkWorkshopStack } from '../lib/cdk-workshop-stack';

const app = new cdk.App();
new CdkWorkshopStack(app, 'CdkWorkshopStack', {
    tags: {
        "Owner": "RAM-AWS-Dev-WSEngineering-WSEng-Admin/mitjaresek",
    }
});
