import argon from "argon2";
import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  FieldResolver,
} from "type-graphql";
import { v4 } from "uuid";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../consts";
import User from "../entities/User";
import { Context } from "../types";
import { sendEmail } from "../utils/sendEmail";
import { validateRegister } from "../utils/validateRegister";
import { UsernamePasswordInput } from "./UsernamePasswordInput";

@ObjectType()
export class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export default class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: Context) {
    if (req.session.userId === user.id) {
      return user.email;
    } else {
      return "";
    }
  }

  @Query(() => [User], { nullable: true })
  async users() {
    const users = await User.find();
    return users;
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: Context) {
    if (!req.session.userId) {
      return null;
    }
    const user = await User.findOne(req.session.userId);
    return user;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("password") newPassword: string,
    @Ctx() { redis }: Context
  ): Promise<UserResponse> {
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "Password length should be more than 2 symbols",
          },
        ],
      };
    }

    const key = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "Token expired",
          },
        ],
      };
    }

    const id = parseInt(userId);
    const user = await User.findOne(id);

    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "User no longer exists",
          },
        ],
      };
    }

    User.update({ id }, { password: await argon.hash(newPassword) });

    await redis.del(key);
    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: Context
  ): Promise<Boolean> {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      //email is not in db
      return false;
    }

    const token = v4();

    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      "ex",
      1000 * 60 * 60 * 24 * 3
    );

    sendEmail(
      [email],
      `<a href="http:localhost:3000/change-password/${token}">Reset password</a>`
    );

    return true;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { req }: Context
  ): Promise<UserResponse> {
    const errors = validateRegister(options);
    if (errors) {
      return { errors };
    } else if (
      (await User.findOne({ where: { username: options.username } }))?.id
    ) {
      return {
        errors: [
          {
            field: "username",
            message: "This username is already taken",
          },
        ],
      };
    } else if ((await User.findOne({ where: { email: options.email } }))?.id) {
      return {
        errors: [
          {
            field: "email",
            message: "This email is already in use",
          },
        ],
      };
    }

    const hashedPass = await argon.hash(options.password);
    const user = await User.create({
      username: options.username.trim(),
      password: hashedPass,
      email: options.email,
    }).save();
    req.session.userId = user.id;
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") userNameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { req }: Context
  ): Promise<UserResponse> {
    const userCredential = userNameOrEmail.includes("@")
      ? { email: userNameOrEmail }
      : { username: userNameOrEmail };
    const user = await User.findOne({ where: userCredential });
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "This username doesn't exist",
          },
        ],
      };
    }
    const valid = await argon.verify(user.password, password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "Invalid password",
          },
        ],
      };
    }
    req.session.userId = user.id;

    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { res, req }: Context): Promise<Boolean> {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }
}
