import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as SessionsTable from '../lib/sessions_table-stack';

test('SessionsTable Created with correct properties', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new SessionsTable.SessionsTableStack(app, 'MyTestStack');
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::DynamoDB::Table', {
    TableName: 'SessionsTable',
    KeySchema: [
      { AttributeName: 'SessionId', KeyType: 'HASH' }
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