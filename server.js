/**
 * Copyright (c) 2018, 1Kosmos Inc. All rights reserved.
 * Licensed under 1Kosmos Open Source Public License version 1.0 (the "License");
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of this license at
 *    https://github.com/1Kosmos/1Kosmos_License/blob/main/LICENSE.txt
 */
const AmazonCognitoIdentity = require("amazon-cognito-identity-js");
const express = require("express");
const hbs = require("hbs");
const app = express();

app.set("view engine", "html");
app.engine("html", hbs.__express);
app.set("views", "./views");
app.use(express.json());
app.use(express.static("public"));

app.use((req, res, next) => {
  if (
    req.get("x-forwarded-proto") &&
    req.get("x-forwarded-proto").split(",")[0] !== "https"
  ) {
    return res.redirect(301, `https://${process.env.HOSTNAME}`);
  }
  req.schema = "https";
  next();
});

app.get("/", (req, res) => {
  res.render("view.html");
});

const port = 8080;
const listener = app.listen(port || process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
