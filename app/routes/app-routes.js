const express = require("express");
const moment = require("moment");
const _ = require("underscore");
const uuidv4 = require("uuid/v4");

const router = express.Router();

const AWS = require("aws-sdk");
AWS.config.update({ region: "us-west-1" });

docClient = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.NOTES_TABLE_NAME;
const user_id = "test_user";
const user_name = "Test User";

router.get("/api/notes", (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 5;

  const params = {
    TableName,
    KeyConditionExpression: "user_id = :uid",
    ExpressionAttributeValues: {
      ":uid": user_id,
    },
    Limit: limit,
    ScanIndexForward: false,
  };

  let startTimestamp = req.query.start ? parseInt(req.query.start) : 0;

  if (startTimestamp > 0) {
    params["ExclusiveStartKey"] = {
      user_id,
      timestamp: startTimestamp,
    };
  }

  docClient.query(params, (err, data) => {
    if (err) {
      res.status(500).json({ error: "Could not load items: " + err.message });
    } else {
      res.json(data);
    }
  });
});

router.get("/api/notes/:note_id", (req, res) => {
  const params = {
    TableName,
    IndexName: "note_id-index",
    KeyConditionExpression: "note_id = :note_id",
    ExpressionAttributeValues: {
      ":note_id": req.params.note_id,
    },
    Limit: 1,
    Key: {
      note_id: req.params.note_id,
    },
  };

  docClient.query(params, (err, data) => {
    if (err) {
      res.status(500).json({ error: "Could not load items: " + err.message });
    } else {
      if (data?.Items?.length > 0) {
        res.json(data.Items[0]);
      } else {
        res.status(404).json({ error: "Note not found" });
      }
    }
  });
});

router.post("/api/note", (req, res, next) => {
  const Item = req.body.Item;
  Item.user_id = user_id;
  Item.user_name = user_name;
  Item.note_id = user_id + ":" + uuidv4();
  Item.timestamp = moment().unix();
  Item.expires = moment().add(90, "days").unix();

  const params = {
    TableName,
    Item,
  };

  docClient.put(params, (err, data) => {
    if (err) {
      console.log(err);
      return res.status(err.statusCode).send({
        message: err.message,
        status: err.statusCode,
      });
    }
    res.status(200).send(Item);
  });
});

router.patch("/api/note", (req, res, next) => {
  let item = req.body.Item;
  item.user_id = user_id;
  item.user_name = user_name;
  item.expires = moment().add(90, "days").unix();
  console.log(item);

  const params = {
    TableName,
    Item: item,
    ConditionExpression: "#t = :t",
    ExpressionAttributeNames: {
      "#t": "timestamp",
    },
    ExpressionAttributeValues: {
      ":t": item.timestamp,
    },
  };

  docClient.put(params, (err, data) => {
    if (err) {
      console.log(err);
      return res.status(err.statusCode).send({
        message: err.message,
        status: err.statusCode,
      });
    }
    return res.status(200).send(item);
  });
});

router.delete("/api/note/:timestamp", (req, res, next) => {
  const params = {
    TableName,
    Key: {
      user_id,
      timestamp: parseInt(req.params.timestamp),
    },
  };
  console.log(
    "🚀 ~ file: app-routes.js ~ line 133 ~ router.delete ~ params",
    params
  );

  docClient.delete(params, (err, data) => {
    if (err) {
      console.log(err);
      return res.status(err.statusCode).send({
        message: err.message,
        status: err.statusCode,
      });
    }
    return res.status(200).send(data);
  });
});
module.exports = router;
