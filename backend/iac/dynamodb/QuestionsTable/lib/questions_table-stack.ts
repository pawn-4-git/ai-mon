import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class QuestionsTableStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const tableNamePrefix = this.node.tryGetContext('TableNamePrefix') || '';
    const tableName = tableNamePrefix + 'QuestionsTable';

    const table = new dynamodb.Table(this, 'QuestionsTable', {
      tableName: tableName,
      partitionKey: {
        name: 'QuestionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    table.addGlobalSecondaryIndex({
      indexName: 'GroupIdIndex',
      partitionKey: {
        name: 'GroupId',
        type: dynamodb.AttributeType.STRING,
      },
    });
  }
}