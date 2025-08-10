import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ResourcesTable from '../lib/resources_table-stack';

test('ResourcesTable Created with correct properties', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new ResourcesTable.ResourcesTableStack(app, 'MyTestStack');
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::DynamoDB::Table', {
    TableName: 'ResourcesTable',
    KeySchema: [
      { AttributeName: 'ResourceId', KeyType: 'HASH' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'GroupIdIndex',
        KeySchema: [
          { AttributeName: 'GroupId', KeyType: 'HASH' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        }
      },
      {
        IndexName: 'CreatedAtIndex',
        KeySchema: [
          { AttributeName: 'CreatedAt', KeyType: 'HASH' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  });

  template.hasResource('AWS::DynamoDB::Table', {
    UpdateReplacePolicy: 'Retain',
    DeletionPolicy: 'Retain',
  });
});