'use strict';

module.exports = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'Hackathon Build Bot DB Stack',
    Resources: {
        stateTable: {
            Type: 'AWS::DynamoDB::Table',
            Properties: {
                AttributeDefinitions: [
                    {
                        AttributeName: 'repo',
                        AttributeType: 'S'
                    }
                ],
                KeySchema: [
                    {
                        AttributeName: 'repo',
                        KeyType: 'HASH'
                    }
                ],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 1,
                    WriteCapacityUnits: 1
                },
                TableName: 'Hackathan-Build-Bot-State'
            }
        }
    }
}
