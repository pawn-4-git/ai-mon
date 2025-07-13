import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as QuestionsTable from '../lib/questions_table-stack';

test('QuestionsTable Created with correct properties', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new QuestionsTable.QuestionsTableStack(app, 'MyTestStack');
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::DynamoDB::Table', {
    TableName: 'QuestionsTable',
    KeySchema: [
      { AttributeName: 'QuestionId', KeyType: 'HASH' }
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
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  });

  template.hasResource('AWS::DynamoDB::Table', {
    UpdateReplacePolicy: 'Retain',
    DeletionPolicy: 'Retain',
  });
});