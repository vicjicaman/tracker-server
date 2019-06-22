require('dotenv').config();
import express from 'express';
import path from 'path';
import fs from 'fs';
import compression from 'compression';
import bodyParser from 'body-parser';
import {RenderStateful} from '@nebulario/tracker-stateful-server';
import App, {reducers, watchers} from "@nebulario/tracker-common/dist/server";
import {createNode} from "@nebulario/tracker-node";

const name = "server-node";
const service_port = process.env.DEV_TRACKER_WEB_SERVICE_PORT || process.env.TRACKER_WEB_SERVICE_PORT;
const graphql_url = process.env.DEV_TRACKER_GRAPH_URL ||process.env.TRACKER_GRAPH_URL;
const events_url = process.env.DEV_TRACKER_EVENTS_URL || process.env.TRACKER_EVENTS_URL;

const mountsWeb = JSON.parse(fs.readFileSync('./node_modules/@nebulario/tracker-web/dist/mountpoints.json', 'utf8'));
const mounts = {
  ...mountsWeb
}
const cxt = {};

const app = createNode({
  name
}, cxt);

app.use(compression());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

for (const m in mounts) {
  const {key, type, manifest, package: pkg} = mounts[m];
  app.use('/mounts/' + m, express.static('./node_modules/' + pkg + '/dist/'))
}

app.get('*', async (req, res) => {

  const routerContext = {}

  RenderStateful({
    App,
    req,
    res,
    mounts,
    reducers,
    watchers,
    urls: {
      graphql: graphql_url,
      events: events_url
    }
  }, cxt);

});

app.listen(service_port);
console.log('Running at ' + service_port);
