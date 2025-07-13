import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class UsersTableStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'UsersTable',
      partitionKey: {
        name: 'UserId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // DEV -> DESTROY, PROD -> RETAIN
      timeToLiveAttribute: 'ExpiresAt',
    });

    table.addGlobalSecondaryIndex({
      indexName: 'AccountNameIndex',
      partitionKey: {
        name: 'AccountName',
        type: dynamodb.AttributeType.STRING,
      },
    });
  }
}
