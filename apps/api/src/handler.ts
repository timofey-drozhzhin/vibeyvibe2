// Bunny Edge Scripting entry point
// This file is the entry for production deployment via bunny-hono
import app from "./app.js";

// @ts-ignore bunny-hono types
import { standaloneHandler } from "bunny-hono";

standaloneHandler(app);

export default app;
