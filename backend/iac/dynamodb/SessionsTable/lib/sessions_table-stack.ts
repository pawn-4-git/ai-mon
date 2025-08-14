import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class SessionsTableStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const tableNamePrefix = this.node.tryGetContext('TableNamePrefix') || '';
    const tableName = tableNamePrefix ? `${tableNamePrefix}SessionsTable` : 'SessionsTable';

    new dynamodb.Table(this, 'SessionsTable', {
      tableName: tableName,
      partitionKey: {
        name: 'SessionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      timeToLiveAttribute: 'ExpiresAt',
    });
  }
}