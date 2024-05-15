import { Bindings } from "./bindings";
import { Hono } from "hono";

const app = new Hono<Bindings>();

app.get('/', (c) => c.text('Hello! it\'s Works!'));

app.fire();
