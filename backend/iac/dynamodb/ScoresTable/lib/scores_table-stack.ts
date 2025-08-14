import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class ScoresTableStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const tableNamePrefix = this.node.tryGetContext('TableNamePrefix') || '';
    const tableName = tableNamePrefix ? `${tableNamePrefix}ScoresTable` : 'ScoresTable';

    const table = new dynamodb.Table(this, 'ScoresTable', {
      tableName: tableName,
      partitionKey: {
        name: 'QuizSessionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      timeToLiveAttribute: 'DataExpiresAt',
    });

    table.addGlobalSecondaryIndex({
      indexName: 'UserIdIndex',
      partitionKey: {
        name: 'UserId',
        type: dynamodb.AttributeType.STRING,
      },
    });
  }
}