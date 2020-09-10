<<<<<<< HEAD
import "reflect-metadata";
import 'dotenv-safe/config';
=======
>>>>>>> bf9058ec8d4195bbd04e06569bad7d1d02d1652d
import { ApolloServer } from "apollo-server-express";
import connectRedis from "connect-redis";
import cors from "cors";
import express from "express";
import session from "express-session";
import Redis from "ioredis";
import path from "path";
<<<<<<< HEAD
=======
import "reflect-metadata";
>>>>>>> bf9058ec8d4195bbd04e06569bad7d1d02d1652d
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

<<<<<<< HEAD
const PORT = process.env.PORT;
=======
const PORT = 4000;
>>>>>>> bf9058ec8d4195bbd04e06569bad7d1d02d1652d

(async () => {
  const conn = await createConnection({
    type: "postgres",
<<<<<<< HEAD
    url: process.env.DATABASE_URL,
    logging: true, 
    entities: [User ,Post, Vote],
    migrations: [path.join(__dirname, "./migrations/*")],
  });
  
=======
    database: "piforum",
    username: "postgres",
    password: "",
    logging: true,
    synchronize: true,
    entities: [Post, User, Vote],
    migrations: [path.join(__dirname, "./migrations/*")],
  });

  // await Post.clear();

>>>>>>> bf9058ec8d4195bbd04e06569bad7d1d02d1652d
  await conn.runMigrations();

  const app = express();

  let RedisStore = connectRedis(session);
<<<<<<< HEAD
  let redisClient = new Redis(process.env.REDIS_URL);

  // app.set("trust proxy", 1);

  app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
=======
  let redisClient = new Redis({});

  app.use(cors({ origin: "http://localhost:3000", credentials: true }));
>>>>>>> bf9058ec8d4195bbd04e06569bad7d1d02d1652d

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redisClient, disableTouch: true }),
      cookie: {
<<<<<<< HEAD
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 day
        httpOnly: true,
        secure: __prod__, //cookie only works in http
        sameSite: "lax",
        domain: __prod__ ? 'piforum.xyz' : ''
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
=======
        maxAge: 1000 * 60 * 60 * 24, // 1 day;
        httpOnly: true,
        secure: __prod__, //cookie only works in http
        sameSite: "lax",
      },
      saveUninitialized: false,
      secret: "sagjpvmwvmodspgpwempasogmpw",
>>>>>>> bf9058ec8d4195bbd04e06569bad7d1d02d1652d
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

<<<<<<< HEAD
  app.listen(parseInt(PORT), () => {
=======
  app.listen(PORT, () => {
>>>>>>> bf9058ec8d4195bbd04e06569bad7d1d02d1652d
    console.log("Server started on localhost:", PORT);
  });
})().catch((err) => {
  console.log(err);
});
