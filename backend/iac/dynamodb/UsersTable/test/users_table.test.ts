import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as UsersTable from '../lib/users_table-stack';

test('UsersTable Created with correct properties', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new UsersTable.UsersTableStack(app, 'MyTestStack');
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::DynamoDB::Table', {
    TableName: 'UsersTable',
    AttributeDefinitions: [
      { AttributeName: 'UserId', AttributeType: 'S' },
      { AttributeName: 'AccountName', AttributeType: 'S' }
    ],
    KeySchema: [
      { AttributeName: 'UserId', KeyType: 'HASH' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'AccountNameIndex',
        KeySchema: [
          { AttributeName: 'AccountName', KeyType: 'HASH' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        }
      }
    ],
    TimeToLiveSpecification: {
      AttributeName: 'ExpiresAt',
      Enabled: true
    },
    BillingMode: 'PAY_PER_REQUEST'
  });

  template.hasResource('AWS::DynamoDB::Table', {
    UpdateReplacePolicy: 'Retain',
    DeletionPolicy: 'Retain',
  });
});