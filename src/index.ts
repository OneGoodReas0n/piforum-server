import "reflect-metadata";
import 'dotenv-safe/config';
import { ApolloServer } from "apollo-server-express";
import connectRedis from "connect-redis";
import cors from "cors";
import express from "express";
import session from "express-session";
import Redis from "ioredis";
import path from "path";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import { COOKIE_NAME, __prod__ } from "./consts";
import Post from "./entities/Post";
import User from "./entities/User";
import Vote from "./entities/Vote";
import PostResolver from "./resolvers/post";
import UserResolver from "./resolvers/user";
import VoteResolver from "./resolvers/vote";
import { Context } from "./types";
import { createUserLoader } from "./utils/createUserLoader";
import { createVoteLoader } from "./utils/createVoteLoader";

const PORT = process.env.PORT;

(async () => {
  const conn = await createConnection({
    type: "postgres",
    url: process.env.DATABASE_URL,
    logging: true, 
    entities: [User ,Post, Vote],
    migrations: [path.join(__dirname, "./migrations/*")],
  });
  
  await conn.runMigrations();

  const app = express();

  let RedisStore = connectRedis(session);
  let redisClient = new Redis(process.env.REDIS_URL);

  // app.set("trust proxy", 1);

  app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redisClient, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 day
        httpOnly: true,
        secure: __prod__, //cookie only works in http
        sameSite: "lax",
        domain: __prod__ ? 'piforum.xyz' : ''
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
      resave: false,
    })
  );

  const apoloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver, VoteResolver],
      validate: false,
    }),
    context: ({ req, res }: Context): Context => ({
      req,
      res,
      redis: redisClient,
      userLoader: createUserLoader(),
      voteLoader: createVoteLoader(),
    }),
  });

  apoloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(parseInt(PORT), () => {
    console.log("Server started on localhost:", PORT);
  });
})().catch((err) => {
  console.log(err);
});
