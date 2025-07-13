import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as QuizGroupsTable from '../lib/quiz_groups_table-stack';

test('QuizGroupsTable Created with correct properties', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new QuizGroupsTable.QuizGroupsTableStack(app, 'MyTestStack');
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::DynamoDB::Table', {
    TableName: 'QuizGroupsTable',
    KeySchema: [
      { AttributeName: 'GroupId', KeyType: 'HASH' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  });

  template.hasResource('AWS::DynamoDB::Table', {
    UpdateReplacePolicy: 'Retain',
    DeletionPolicy: 'Retain',
  });
});