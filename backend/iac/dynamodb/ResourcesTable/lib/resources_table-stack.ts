import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class ResourcesTableStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'ResourcesTable', {
      tableName: 'ResourcesTable',
      partitionKey: {
        name: 'ResourceId',
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

    // Add index for CreatedAt
    table.addGlobalSecondaryIndex({
      indexName: 'CreatedAtIndex',
      partitionKey: {
        name: 'CreatedAt',
        type: dynamodb.AttributeType.STRING, // Assuming CreatedAt is stored as a string (e.g., ISO 8601 format)
      },
    });
  }
}