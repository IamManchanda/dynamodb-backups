const { config, DynamoDB } = require("aws-sdk");
const sortBy = require("lodash/sortBy");
const moment = require("moment");

config.update({
  region: "eu-west-1",
});

const dynamodb = new DynamoDB();

exports.handler = (event, context, callback) => {
  event.Records.forEach((record) => {
    dynamodb.listBackups(
      {
        TableName: record.TableName,
      },
      (err, data) => {
        if (err) {
          console.log(err);
        } else {
          const backups = sortBy(
            data.BackupSummaries,
            "BackupCreationDateTime",
          );
          const backupsToRemove = record.RetentionCount - 1;
          backups.splice(-backupsToRemove, backupsToRemove);
          backups.forEach((backup) => {
            dynamodb.deleteBackup(
              {
                BackupArn: backup.BackupArn,
              },
              (err, data) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log(data);
                }
              },
            );
          });
          dynamodb.createBackup(
            {
              TableName: record.TableName,
              BackupName: `${record.TableName}_${moment().unix()}`,
            },
            (err, data) => {
              if (err) {
                console.log(err);
              } else {
                console.log(data);
              }
            },
          );
        }
      },
    );
  });
  callback(null, "Execution successful.");
};
