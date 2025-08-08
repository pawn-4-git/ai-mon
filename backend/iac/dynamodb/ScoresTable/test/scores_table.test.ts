import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ScoresTable from '../lib/scores_table-stack';

test('ScoresTable Created with correct properties', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new ScoresTable.ScoresTableStack(app, 'MyTestStack');
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::DynamoDB::Table', {
    TableName: 'ScoresTable',
    AttributeDefinitions: [
      { AttributeName: 'QuizSessionId', AttributeType: 'S' },
      { AttributeName: 'UserId', AttributeType: 'S' },
      { AttributeName: 'StartedAt', AttributeType: 'S' }
    ],
    KeySchema: [
      { AttributeName: 'QuizSessionId', KeyType: 'HASH' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'UserIdIndex',
        KeySchema: [
          { AttributeName: 'UserId', KeyType: 'HASH' },
          { AttributeName: 'StartedAt', KeyType: 'RANGE' }
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